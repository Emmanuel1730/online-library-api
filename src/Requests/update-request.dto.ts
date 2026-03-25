import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from './create-request.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateRequestDto extends PartialType(CreateRequestDto) {
  // Only admins updating the request can send these fields
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
