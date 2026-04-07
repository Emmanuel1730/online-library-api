import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  Query,
  Param,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { CreateResourceWithFileDto } from './create-resource-with-file.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtUser } from 'src/Auth/jwt-user.inteface';

@UseGuards(AuthGuard('jwt'))
@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Post('create-with-file')
  @UseInterceptors(FileInterceptor('file'))
  async createWithFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateResourceWithFileDto,
    @Req() req: { user: JwtUser },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.service.createWithFile(file, body, req.user);
  }

  @Post(':id/download')
  async download(@Param('id') id: string) {
    return this.service.incrementDownload(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: { user: JwtUser }) {
    return this.service.remove(id, req.user);
  }

  @Get()
  async findAll(@Req() req: { user: JwtUser }, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }
}