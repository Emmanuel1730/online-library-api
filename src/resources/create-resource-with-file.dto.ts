import { IsString, IsUUID, IsEnum } from 'class-validator';

export class CreateResourceWithFileDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUUID()
  categoryId: string;

  @IsUUID()
  schoolId: string;

  @IsUUID()
  uploaderId: string;

  @IsEnum(['public', 'school', 'restricted'])
  visibility: 'public' | 'school' | 'restricted';
}