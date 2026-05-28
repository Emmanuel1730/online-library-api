import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './categories.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../Profile/profile.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async create(dto: any, user: any) {
    // Admins pass schoolId in the body; teachers/students use their own
    const schoolId =
      user.role === UserRole.ADMIN ? dto.schoolId : user.schoolId;

    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    const category = this.repo.create({
      name: dto.name,
      school: { id: schoolId },
    });

    return this.repo.save(category);
  }

  async findAll(user: any) {
  return this.repo.find({
    relations: ['school', 'resources'],
  });
}
}