import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  // 1. Create a new library member
  createProfile(profileData: Partial<Profile>) {
    const newProfile = this.profileRepository.create(profileData);
    return this.profileRepository.save(newProfile);
  }

  // 2. Get all library members
  getAllProfiles() {
    return this.profileRepository.find();
  }

  // 3. Find a specific user by their email for login
  async findByEmail(email: string): Promise<Profile | null> {
    return this.profileRepository.findOne({ where: { email } });
  }
}
