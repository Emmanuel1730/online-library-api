import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  requestName: string;

  @IsString()
  @IsNotEmpty()
  fromUser: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  @IsOptional()
  userId?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
