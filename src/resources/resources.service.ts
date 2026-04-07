import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
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

    if (user.role === UserRole.STUDENT) {
      throw new ForbiddenException('Students cannot upload');
    }

    const schoolId = user.schoolId;

    const school = schoolId
      ? await this.schoolRepo.findOne({ where: { id: schoolId } })
      : null;

    if (user.role !== UserRole.ADMIN && !school) {
      throw new BadRequestException('Invalid school');
    }

    // 1. Upload file to storage
    const fileUrl = await this.supabaseService.uploadFile(file);

    // 2. Create and save resource
    const resource = this.resourceRepo.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      form: dto.form,
      status: dto.status,
      targetAudience: dto.targetAudience,
      visibility: dto.visibility,
      fileUrl,
      isActive: true,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
      school: schoolId ? ({ id: schoolId } as any) : null,
      uploaderId: String(user.id),
      uploader: { id: user.id } as any,
    });

    const savedResource = await this.resourceRepo.save(resource);

    // 3. Create upload record linked to the saved resource
    const upload = this.uploadRepo.create({
      fileUrl,
      filePath: fileUrl,
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
    const qb = this.resourceRepo
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.category', 'category')
      .leftJoinAndSelect('resource.school', 'school')
      .leftJoinAndSelect('resource.uploader', 'uploader')
      .leftJoinAndSelect('resource.uploads', 'uploads')
      .where('resource.isActive = true');

    if (user.role !== UserRole.ADMIN && user.schoolId) {
      qb.andWhere('school.id = :schoolId', {
        schoolId: user.schoolId,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async incrementDownload(resourceId: string) {
    await this.resourceRepo.increment(
      { id: resourceId },
      'downloadCount',
      1,
    );

    return { message: 'Download tracked' };
  }

  async remove(id: string, user: JwtUser) {
    const resource = await this.resourceRepo.findOne({
      where: { id },
      relations: ['uploads', 'school', 'uploader'],
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = resource.uploader?.id === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Not allowed');
    }

    await this.uploadRepo.delete({ resource: { id } as any });
    await this.resourceRepo.delete(id);

    return { message: 'Deleted', id };
  }
}
