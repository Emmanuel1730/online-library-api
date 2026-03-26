import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Built-in NestJS JWT Guard

// --- PROFILES IMPORTS (Same Folder) ---
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './create-profile.dto';
import { Role } from 'src/Auth/role.enum';
// --- AUTH IMPORTS (Cross Folder) ---
// Notice the capital 'A' to match your folder structure exactly!
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard) // Checks token FIRST, then checks Role
@Controller('api/profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Roles(Role.ADMIN)
  @Get()
  getAllProfiles() {
    return this.profileService.getAllProfiles();
  }
  // 1. Route to create a new user
  @Post()
  createProfile(@Body() profileData: CreateProfileDto) {
    return this.profileService.createProfile(profileData);
  }

  // 2. Route to see YOUR OWN profile

  @Get('me')
  async getMyprofile(@Request() req) {
    const userId = req.user.id;
    return this.profileService.getProfileWithRequests(userId);
  }

  // 3. Route to see ALL users (ONLY Admins)
}
