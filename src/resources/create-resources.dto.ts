import {
  IsEnum,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ResourceType,
  ResourceStatus,
  ResourceForm,
  ResourceVisibility,
} from './resources.entity';

export class CreateResourceDto {
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
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;
  // ────────────────────────────────────────────────────────────────
}