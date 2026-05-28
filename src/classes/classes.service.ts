import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SchoolClass } from './classes.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../Profile/profile.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(SchoolClass)
    private repo: Repository<SchoolClass>,
  ) {}

  async create(dto: any, user: any) {
    // Admins pass schoolId in the body; teachers/students use their own
    const schoolId =
      user.role === UserRole.ADMIN ? dto.schoolId : user.schoolId;

    if (!schoolId) {
      throw new BadRequestException('schoolId is required');
    }

    const schoolClass = this.repo.create({
      name: dto.name,
      school: { id: schoolId },
    });

    return this.repo.save(schoolClass);
  }

  async findAll(user: any) {
  return this.repo.find({
    relations: ['school'],
  });
}
}