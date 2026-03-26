import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // 👈 key
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.service.create(body, file);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}