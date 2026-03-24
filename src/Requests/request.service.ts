import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './request.entity';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private requestRepository: Repository<Request>,
  ) {}

  findAll(): Promise<Request[]> {
    return this.requestRepository.find();
  }
  async create(data: Partial<Request>): Promise<Request> {
    const newRequest = this.requestRepository.create(data);
    return await this.requestRepository.save(newRequest);
  }

  // Add more methods here for creating/deleting requests later
  async updateStatus(id: number, status: string): Promise<Request | null> {
    await this.requestRepository.update(id, { status });
    return this.requestRepository.findOneBy({ id });
  }
  //Delete a request
  async remove(id: number): Promise<void> {
    await this.requestRepository.delete(id);
  }
}
// import { NotFoundException } from '@nestjs/common'; // Add this to your imports at the top!

// ...

// async updateStatus(id: number, status: string): Promise<Request> {
//  await this.requestRepository.update(id, { status });
// const updatedRequest = await this.requestRepository.findOneBy({ id });

// if (!updatedRequest) {
//   throw new NotFoundException(Request with ID ${id} not found);
// }

// return updatedRequest;
// }
