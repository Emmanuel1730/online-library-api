import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum SchoolType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export class CreateSchoolDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}