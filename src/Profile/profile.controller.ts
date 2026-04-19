import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './create-profile.dto';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';
import { JwtAuthGuard } from 'src/Auth/jwt-auth-guard';
import { UserRole } from './profile.entity';

@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // 🔓 PUBLIC: register any user
  @Post()
  createProfile(@Body() profileData: CreateProfileDto) {
    return this.profileService.createProfile(profileData);
  }

  // 🔒 ADMIN: create another admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('create-admin')
  createAdmin(@Body() profileData: CreateProfileDto) {
    return this.profileService.createProfile({
      ...profileData,
      role: UserRole.ADMIN,
    });
  }

  // 🔒 ADMIN: get all profiles
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  getAllProfiles() {
    return this.profileService.getAllProfiles();
  }

  // 🔒 ADMIN: get only admin profiles
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admins')
  getAdmins() {
    return this.profileService.getAdmins();
  }

  // 🔒 ADMIN: update a profile's role or status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  updateProfile(@Param('id') id: string, @Body() data: any) {
    return this.profileService.updateProfile(Number(id), data);
  }

  // 🔒 ANY AUTH: get own profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: any) {
    return this.profileService.getProfileWithRequests(req.user.id);
  }
}