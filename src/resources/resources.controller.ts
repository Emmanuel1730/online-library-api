import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { CreateResourceWithFileDto } from './create-resource-with-file.dto';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Post('create-with-file')
  @UseInterceptors(FileInterceptor('file'))
  createWithFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateResourceWithFileDto,
    @Req() req: any,
  ) {
    return this.service.createWithFile(file, body, req.user);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user);
  }
}