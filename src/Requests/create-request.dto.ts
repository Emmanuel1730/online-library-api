import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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

  @IsString()
  @IsOptional()
  description?: string;
}
