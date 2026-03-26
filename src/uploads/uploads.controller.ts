// uploads/uploads.controller.ts

import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from '../firebase/firebase.service';

@Controller('uploads')
export class UploadsController {
  constructor(private firebaseService: FirebaseService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const url = await this.firebaseService.uploadFile(file);

    return { fileUrl: url };
  }
}