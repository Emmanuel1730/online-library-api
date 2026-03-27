import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { School } from './school.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private repo: Repository<School>,
  ) {}

  async create(data: any) {
    const school = this.repo.create(data);
    return this.repo.save(school);
  }

  findAll() {
    return this.repo.find({
      relations: ['categories', 'resources', 'profiles'],
    });
  }
}