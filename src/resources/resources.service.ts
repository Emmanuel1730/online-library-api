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
import { UserRole } from 'src/Profile/profile.entity';
import { JwtUser } from 'src/Auth/jwt-user.inteface';

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

  async createWithFile(
    file: Express.Multer.File,
    dto: CreateResourceWithFileDto,
    user: JwtUser,
  ) {
    if (!file) throw new BadRequestException('File required');

    // RBAC
    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException('Students cannot upload');
    }

    const schoolId = user.schoolId;

    if (user.role !== UserRole.ADMIN && !schoolId) {
      throw new ForbiddenException('Missing school context');
    }

    const school = schoolId
      ? await this.schoolRepo.findOne({ where: { id: schoolId } })
      : null;

    if (user.role !== UserRole.ADMIN && !school) {
      throw new BadRequestException('Invalid school');
    }

    const fileUrl = await this.supabaseService.uploadFile(file);

    const resource = this.resourceRepo.create({
      title: dto.title,
      description: dto.description,
      visibility: dto.visibility,
      category: { id: dto.categoryId } as any,
      school: schoolId ? ({ id: schoolId } as any) : null,
      uploader: { id: user.id } as any,
    });

    const savedResource = await this.resourceRepo.save(resource);

    const upload = this.uploadRepo.create({
      fileUrl,
      fileType: file.mimetype,
      uploaderId: String(user.id),
      schoolId: String(user.schoolId),
      resource: savedResource,
    });

    const savedUpload = await this.uploadRepo.save(upload);

    return {
      ...savedResource,
      uploads: [savedUpload],
    };
  }

  async findAll(user: JwtUser, query: any) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const search = query.search ?? '';
    const categoryId = query.categoryId;
    const visibility = query.visibility;

    const qb = this.resourceRepo
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.category', 'category')
      .leftJoinAndSelect('resource.school', 'school')
      .leftJoinAndSelect('resource.uploader', 'uploader')
      .leftJoinAndSelect('resource.uploads', 'uploads')
      .where('resource.isActive = true');

    // SCHOOL ISOLATION
    if (user.role !== UserRole.ADMIN && user.schoolId) {
      qb.andWhere('school.id = :schoolId', {
        schoolId: user.schoolId,
      });
    }

    if (search) {
      qb.andWhere(
        '(resource.title ILIKE :search OR resource.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (visibility) {
      qb.andWhere('resource.visibility = :visibility', {
        visibility,
      });
    }

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async incrementDownload(resourceId: string) {
    await this.resourceRepo.increment(
      { id: resourceId },
      'downloadCount',
      1,
    );

    return { message: 'Download tracked' };
  }
}