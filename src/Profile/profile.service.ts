import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Profile } from './profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  // 1. Create a new library member
  async createProfile(data: any): Promise<Profile> {
  const profile = this.profileRepository.create({
    ...data,
    school: data.schoolId ? { id: data.schoolId } : undefined,
  });

  const saved = await this.profileRepository.save(profile);

  const savedProfile = Array.isArray(saved) ? saved[0] : saved;

  if (!savedProfile) {
    throw new NotFoundException('Profile not saved correctly');
  }

  const fullProfile = await this.profileRepository.findOne({
    where: { id: savedProfile.id },
    relations: ['school'],
  });

  if (!fullProfile) {
    throw new NotFoundException('Profile not found after creation');
  }

  return fullProfile;
}

  // 2. Get all library members
  getAllProfiles() {
    return this.profileRepository.find({
      relations: ['school'],
    });
  }

  // 3. Find user by email (USED IN AUTH)
  async findByEmail(email: string): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { email },
      relations: ['school'],
    });
  }

  // 4. Get profile with requests (USED IN REFRESH TOKEN)
  async getProfileWithRequests(userId: number): Promise<Profile | null> {
    return await this.profileRepository.findOne({
      where: { id: userId },
      relations: ['requests', 'school'],
    });
  }

  // 5. Update profile
  async updateProfile(
    id: number,
    attrs: Partial<Profile>,
  ): Promise<Profile | null> {
    await this.profileRepository.update(id, attrs);

    return await this.profileRepository.findOne({
      where: { id },
      relations: ['school'],
    });
  }

  // 6. Find by reset token
  async findByResetToken(token: string): Promise<Profile | null> {
    return await this.profileRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
      relations: ['school'],
    });
  }
}