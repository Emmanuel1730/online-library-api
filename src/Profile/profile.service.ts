import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';
import { Request } from '../Requests/request.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  // 1. Create a new library member
  async createProfile(data: any): Promise<Profile> {
    const profile = this.profileRepository.create(data) as any;
    // Ensure you are returning the awaited result directly
    return await this.profileRepository.save(profile);
  }

  // 2. Get all library members
  getAllProfiles() {
    return this.profileRepository.find();
  }

  // 3. Find a specific user by their email for login
  async findByEmail(email: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { email } });
  }
  async getProfileWithRequests(userId: number) {
    return await this.profileRepository.findOne({
      where: { id: userId },
      relations: ['requests'], // This pulls the bridge data!
    });
  }
  // 4. Update a profile (used for saving refresh tokens)
  async updateProfile(id: number, attrs: Partial<Profile>) {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) {
      throw new Error('Profile not found');
    }
    Object.assign(profile, attrs);
    return await this.profileRepository.save(profile);
  }
}
