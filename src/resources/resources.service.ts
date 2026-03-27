import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Resource } from './resources.entity';
import { Upload } from 'src/uploads/uploads.entity';
import { SupabaseService } from 'src/supabase/supabase.service';
import { CreateResourceWithFileDto } from './create-resource-with-file.dto';
import { School } from 'src/school/school.entity';
import { Profile, UserRole } from 'src/Profile/profile.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourceRepo: Repository<Resource>,

    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,

    @InjectRepository(School)
    private schoolRepo: Repository<School>,

    private supabaseService: SupabaseService,
  ) {}

  // ✅ CREATE WITH RBAC
  async createWithFile(
    file: Express.Multer.File,
    dto: CreateResourceWithFileDto,
    user: Profile, // 🔥 IMPORTANT
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // ❌ BLOCK STUDENTS
    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException('Students cannot upload');
    }

    const school = await this.schoolRepo.findOne({
      where: { id: dto.schoolId },
    });

    if (!school) {
      throw new BadRequestException('Invalid school');
    }

    // ❌ TEACHER PERMISSION CHECK
    if (
      user.role === UserRole.TEACHER &&
      school.teachersCanUpload === false
    ) {
      throw new ForbiddenException('Teachers not allowed to upload');
    }

    // 1. Upload file
    const fileUrl = await this.supabaseService.uploadFile(file);

    // 2. Create resource
    const resource = this.resourceRepo.create({
      title: dto.title,
      description: dto.description,
      visibility: dto.visibility,
      category: { id: dto.categoryId } as any,
      school: { id: dto.schoolId } as any,
      uploader: { id: user.id } as any, // 🔥 NEVER trust dto uploaderId
    });

    const savedResource = await this.resourceRepo.save(resource);

    // 3. Save upload
    const upload = this.uploadRepo.create({
      fileUrl,
      fileType: file.mimetype,
      resource: savedResource,
    });

    const savedUpload = await this.uploadRepo.save(upload);

    return {
      ...savedResource,
      uploads: [savedUpload],
    };
  }

  // ✅ RBAC + MULTI SCHOOL + VISIBILITY
  async findAll(user: Profile) {
    const query = this.resourceRepo
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.category', 'category')
      .leftJoinAndSelect('resource.school', 'school')
      .leftJoinAndSelect('resource.uploader', 'uploader')
      .leftJoinAndSelect('resource.uploads', 'uploads')
      .where('resource.isActive = :isActive', { isActive: true });

    if (user.role !== UserRole.ADMIN) {
      query.andWhere(
        `(resource.visibility = :public OR resource.schoolId = :schoolId)`,
        {
          public: 'public',
          schoolId: user.school.id,
        },
      );
    }

    return query.getMany();
  }
}