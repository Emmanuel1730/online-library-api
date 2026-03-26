import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Settings } from './settings.entity';
import { RolesGuard } from '../Auth/roles.guard'; // <-- Import the guard

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  // Look! We put the bouncer in front of this specific route!
  @UseGuards(RolesGuard)
  @Patch()
  updateSettings(@Body() settingsData: Partial<Settings>) {
    return this.settingsService.updateSettings(settingsData);
  }
}
