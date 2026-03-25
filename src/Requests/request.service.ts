import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './request.entity';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
  ) {}

  async findAll() {
    // The 'relations' array tells TypeORM to "join" the Profile table
    // so you get the user's name and email along with the request!
    return await this.requestRepository.find({
      relations: ['user'],
    });
  }

  // 1. Add userId as the second parameter here
  async create(createRequestDto: any, userId: number) {
    const newRequest = this.requestRepository.create({
      ...createRequestDto,
      // 2. This links the request to the specific Profile ID in the database!
      user: { id: userId },
    });

    return await this.requestRepository.save(newRequest);
  }

  // Add more methods here for creating/deleting requests later
  async updateStatus(id: number, status: string) {
    // Validate that the status is one of the allowed options
    const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!allowedStatuses.includes(status.toUpperCase())) {
      throw new BadRequestException('Invalid status update');
    }

    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    request.status = status.toUpperCase();
    return this.requestRepository.save(request);
  }
  //Delete a request
  async remove(id: number): Promise<void> {
    await this.requestRepository.delete(id);
  }
}
