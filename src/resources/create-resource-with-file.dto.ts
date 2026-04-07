import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { ResourceStatus, ResourceType, ResourceForm, ResourceVisibility } from './resources.entity';

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
}