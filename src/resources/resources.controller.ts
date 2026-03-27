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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import { CreateResourceWithFileDto } from './create-resource-with-file.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtUser } from 'src/Auth/jwt-user.inteface';

@UseGuards(AuthGuard('jwt')) // ✅ REQUIRED
@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  @Post('create-with-file')
  @UseInterceptors(FileInterceptor('file'))
  createWithFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateResourceWithFileDto,
    @Req() req: { user: JwtUser }, // ✅ FIXED TYPE
  ) {
    return this.service.createWithFile(file, body, req.user);
  }

  @Post(':id/download')
  download(@Param('id') id: string) {
    return this.service.incrementDownload(id);
  }

  @Get()
  findAll(@Req() req, @Query() query: any) {
    return this.service.findAll(req.user, query);
  }
}