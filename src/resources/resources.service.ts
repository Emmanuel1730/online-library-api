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

    const fileUrl = await this.supabaseService.uploadFile(file);

    // ── Resolve premium fields ───────────────────────────────────
    // isPremium comes from FormData as the string "true"/"false";
    // the @Transform in the DTO converts it to a boolean for us.
    const isPremium = dto.isPremium ?? false;
    // If someone marks a resource as premium but forgets to set a price,
    // throw a clear error rather than silently saving price = 0.
    if (isPremium && (!dto.price || Number(dto.price) <= 0)) {
      throw new BadRequestException(
        'A premium resource must have a price greater than 0',
      );
    }
    const price = isPremium ? Number(dto.price) : 0;
    // ────────────────────────────────────────────────────────────

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
      isPremium,
      price,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
      targetClass: dto.classId ? ({ id: dto.classId } as any) : null,
      school: schoolId ? ({ id: schoolId } as any) : null,
      uploaderId: String(user.id),
      uploader: { id: user.id } as any,
    });

    const savedResource = await this.resourceRepo.save(resource);

    const upload = this.uploadRepo.create({
      fileUrl,
      filePath: fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
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
      .leftJoinAndSelect('resource.targetClass', 'targetClass')
      .where('resource.isActive = true');

    if (user.role !== UserRole.ADMIN && user.schoolId) {
      qb.andWhere(
        '(resource.visibility = :public OR school.id = :schoolId)',
        { public: 'PUBLIC', schoolId: user.schoolId },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async update(
    id: string,
    dto: Partial<CreateResourceWithFileDto>,
    user: JwtUser,
  ) {
    const resource = await this.resourceRepo.findOne({
      where: { id },
      relations: ['uploader', 'school'],
    });

    if (!resource) throw new NotFoundException('Resource not found');

    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = resource.uploader?.id === user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Not allowed to edit this resource');
    }

    // ── Handle premium update ────────────────────────────────────
    let premiumUpdate: Partial<Resource> = {};
    if (dto.isPremium !== undefined) {
      const isPremium = dto.isPremium;
      const price = isPremium ? Number(dto.price ?? resource.price) : 0;
      if (isPremium && price <= 0) {
        throw new BadRequestException(
          'A premium resource must have a price greater than 0',
        );
      }
      premiumUpdate = { isPremium, price };
    }
    // ────────────────────────────────────────────────────────────

    await this.resourceRepo.update(id, {
      ...(dto.title          && { title: dto.title }),
      ...(dto.description    && { description: dto.description }),
      ...(dto.type           && { type: dto.type }),
      ...(dto.form           && { form: dto.form }),
      ...(dto.status         && { status: dto.status }),
      ...(dto.targetAudience && { targetAudience: dto.targetAudience }),
      ...(dto.visibility     && { visibility: dto.visibility }),
      ...(dto.categoryId     && { category: { id: dto.categoryId } as any }),
      ...(dto.classId        && { targetClass: { id: dto.classId } as any }),
      ...premiumUpdate,
    });

    return this.resourceRepo.findOne({
      where: { id },
      relations: ['category', 'targetClass', 'school', 'uploader'],
    });
  }

  async incrementDownload(resourceId: string) {
    await this.resourceRepo.increment({ id: resourceId }, 'downloadCount', 1);
    return { message: 'Download tracked' };
  }

  async remove(id: string, user: JwtUser) {
    const resource = await this.resourceRepo.findOne({
      where: { id },
      relations: ['uploads', 'school', 'uploader'],
    });

    if (!resource) throw new NotFoundException('Resource not found');

    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = resource.uploader?.id === user.id;

    if (!isAdmin && !isOwner) throw new ForbiddenException('Not allowed');

    await this.uploadRepo.delete({ resource: { id } as any });
    await this.resourceRepo.delete(id);

    return { message: 'Deleted', id };
  }
}