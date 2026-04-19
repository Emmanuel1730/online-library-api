import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassResource } from './class-resource.entity';

@Injectable()
export class ClassResourceService {
  constructor(
    @InjectRepository(ClassResource)
    private repo: Repository<ClassResource>,
  ) {}

  async assign(classId: string, resourceId: string) {
    const existing = await this.repo.findOne({ where: { classId, resourceId } });
    if (existing) throw new ConflictException('Resource already assigned to this class');

    const record = this.repo.create({ classId, resourceId });
    return this.repo.save(record);
  }

  async remove(classId: string, resourceId: string) {
    const record = await this.repo.findOne({ where: { classId, resourceId } });
    if (!record) throw new NotFoundException('Assignment not found');
    await this.repo.remove(record);
    return { message: 'Resource removed from class' };
  }

  async getResourcesForClass(classId: string) {
    return this.repo.find({
      where: { classId },
      relations: ['resource', 'resource.category'],
      order: { assignedAt: 'DESC' },
    });
  }

  async getClassesForResource(resourceId: string) {
    return this.repo.find({
      where: { resourceId },
      relations: ['class'],
    });
  }
}