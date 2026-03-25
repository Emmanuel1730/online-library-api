import { CreateProfileDto } from './create-profile.dto';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './profile.entity';

@Controller('api/profiles') // This sets your URL to http://localhost:3000/api/profiles
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Route to create a new user in Postman
  @Post()
  createProfile(@Body() profileData: CreateProfileDto) {
    return this.profileService.createProfile(profileData);
  }

  // Route to see all users in Postman
  @Get()
  getAllProfiles() {
    return this.profileService.getAllProfiles();
  }
}
