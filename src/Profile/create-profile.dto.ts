import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
} from 'class-validator';
import { UserRole } from './profile.entity';

export class CreateProfileDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  // role optional (defaults handled in service if needed)
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsString()
  libraryCardNumber: string;

  // 🔴 FIX: optional for ADMIN, required logic moved to service
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}