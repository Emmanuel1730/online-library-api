import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  age?: number;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  libraryCardNumber: string;
}
