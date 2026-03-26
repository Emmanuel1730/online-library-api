import { IsBoolean, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateSettingDto {
  @IsString()
  @IsOptional()
  libraryName?: string;

  @IsBoolean()
  @IsOptional()
  allowPublicUploads?: boolean;

  @IsString()
  @IsOptional()
  theme?: string;

  // I swapped IsString for IsEmail here to give you even better validation!
  @IsEmail({}, { message: 'Please provide a valid contact email' })
  @IsOptional()
  contactEmail?: string;
}
