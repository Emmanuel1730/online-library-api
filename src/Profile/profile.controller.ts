import { CreateProfileDto } from './create-profile.dto';
import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request as Req,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './profile.entity';
import { RolesGuard } from 'src/Auth/roles.guard';
import { TokenExpiredError } from '@nestjs/jwt';

@Controller('api/profiles') // This sets your URL to http://localhost:3000/api/profiles
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Route to create a new user in Postman
  @Post()
  createProfile(@Body() profileData: CreateProfileDto) {
    return this.profileService.createProfile(profileData);
  }

  @UseGuards(RolesGuard)
  // Route to see all users in Postman
  @Get('me')
  async getMyprofile(@Req() req) {
    //req.user.sub is the ID stored in the JWT token
    const userId = req.user.sub;
    return this.profileService.getProfileWithRequests(userId);
  }

  getAllProfiles() {
    return this.profileService.getAllProfiles();
  }
}
