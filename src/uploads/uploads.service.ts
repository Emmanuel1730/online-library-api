import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './uploads.entity';
import { SupabaseService } from 'src/supabase/supabase.service';
import { CreateUploadDto } from './create-upload.dto';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,
    private supabaseService: SupabaseService,
  ) {}

  async create(file: Express.Multer.File, dto: CreateUploadDto) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileUrl = await this.supabaseService.uploadFile(file);

    const upload = this.uploadRepo.create({
      fileUrl,
      filePath: fileUrl,
      fileType: file.mimetype,
      resource: dto.resourceId ? ({ id: dto.resourceId } as any) : null,
      schoolId: dto.schoolId,
      uploaderId: dto.uploaderId,
    });

    return this.uploadRepo.save(upload);
  }
}