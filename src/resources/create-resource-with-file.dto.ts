import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  ResourceStatus,
  ResourceType,
  ResourceForm,
  ResourceVisibility,
} from './resources.entity';

export class CreateResourceWithFileDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsOptional()
  @IsEnum(ResourceForm)
  form?: ResourceForm;

  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsEnum(ResourceVisibility)
  visibility?: ResourceVisibility;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  // ── Premium fields ───────────────────────────────────────────────
  // FormData sends everything as strings, so we transform before validating
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
  // ────────────────────────────────────────────────────────────────
}