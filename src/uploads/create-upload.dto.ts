import { IsOptional, IsString } from 'class-validator';

export class CreateUploadDto {
  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsString()
  schoolId?: string;

  @IsOptional()
  @IsString()
  uploaderId?: string;
}