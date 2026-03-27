import { IsString, IsUUID, IsEnum } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  schoolId: string;

  @IsUUID()
  categoryId: string;

  @IsEnum(['public', 'school', 'restricted'])
  visibility: 'public' | 'school' | 'restricted';
}