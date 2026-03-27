import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ResourceVisibility } from './resource-visibility.enum';

export class CreateResourceWithFileDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(ResourceVisibility)
  visibility: ResourceVisibility;
}