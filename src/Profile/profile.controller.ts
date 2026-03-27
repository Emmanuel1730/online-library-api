import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

// ✅ Use your custom guard (cleaner + reusable)

// --- PROFILES IMPORTS ---
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './create-profile.dto';

// --- AUTH IMPORTS ---
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';
import { JwtAuthGuard } from 'src/Auth/jwt-auth-guard';

@Controller('api/profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // 🔓 PUBLIC ROUTE (NO GUARDS)
  @Post()
  createProfile(@Body() profileData: CreateProfileDto) {
    return this.profileService.createProfile(profileData);
  }

  // 🔒 PROTECTED: ONLY ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  getAllProfiles() {
    return this.profileService.getAllProfiles();
  }

  // 🔒 PROTECTED: ANY AUTHENTICATED USER
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: any) {
    if (!req.user) {
      throw new Error('User not found in request');
    }

    const userId = req.user.id;

    return this.profileService.getProfileWithRequests(userId);
  }
}