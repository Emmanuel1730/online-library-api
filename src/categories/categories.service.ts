import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './categories.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  // CREATE CATEGORY (forced school binding)
  async create(dto: any, user: any) {
    const category = this.repo.create({
      name: dto.name,
      school: user.school, // 🔥 enforced from token
    });

    return this.repo.save(category);
  }

  // GET ONLY SCHOOL CATEGORIES
  async findAll(user: any) {
    return this.repo.find({
      where: {
        school: {
          id: user.school.id,
        },
      },
      relations: ['school', 'resources'],
    });
  }
}