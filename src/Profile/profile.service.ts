import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Profile, UserRole } from './profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
  ) {}

  async createProfile(data: any): Promise<Profile> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const profile = this.profileRepository.create({
        ...data,
        password: hashedPassword,
        school: data.schoolId ? { id: data.schoolId } : undefined,
      });

      const saved = await this.profileRepository.save(profile);
      const savedProfile = Array.isArray(saved) ? saved[0] : saved;

      if (!savedProfile) throw new NotFoundException('Profile not saved correctly');

      const fullProfile = await this.profileRepository.findOne({
        where: { id: savedProfile.id },
        relations: ['school'],
      });

      if (!fullProfile) throw new NotFoundException('Profile not found after creation');

      return fullProfile;
    } catch (error) {
      if (error?.code === '23505') {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  getAllProfiles() {
    return this.profileRepository.find({ relations: ['school'] });
  }

  async findByEmail(email: string): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { email },
      relations: ['school'],
    });
  }

  // ✅ added — used by AuthService.changePassword
  async findById(id: number): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { id },
      relations: ['school'],
    });
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  async getProfileWithRequests(userId: number): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { id: userId },
      relations: ['requests', 'school'],
    });
  }

  async updateProfile(id: number, attrs: Partial<Profile>) {
    await this.profileRepository.update(id, attrs);
    return this.profileRepository.findOne({
      where: { id },
      relations: ['school'],
    });
  }

  async findByResetToken(token: string): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: {
        resetPasswordToken:   token,
        resetPasswordExpires: MoreThan(new Date()),
      },
      relations: ['school'],
    });
  }

  async getAdmins() {
    return this.profileRepository.find({
      where: { role: UserRole.ADMIN },
      relations: ['school'],
      order: { joinDate: 'DESC' },
    });
  }
}