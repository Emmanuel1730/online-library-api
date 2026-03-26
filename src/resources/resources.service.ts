import { Injectable } from '@nestjs/common';
import { Resource } from './resources.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FirebaseService } from 'src/firebase/firebase.service'; // 👈 ADD

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private repo: Repository<Resource>,

    private firebaseService: FirebaseService, // 👈 ADD
  ) {}

  async create(data: any, file: Express.Multer.File) {
  const fileUrl = await this.firebaseService.uploadFile(file);

  const resource = this.repo.create({
    title: data.title,
    description: data.description,
    fileUrl,

    category: { id: data.categoryId },
    school: { id: data.schoolId },
    uploader: { id: data.uploaderId },
  });

  return this.repo.save(resource);
}

  findAll() {
    return this.repo.find({
      relations: ['category', 'school', 'uploader', 'quizzes'],
    });
  }
}