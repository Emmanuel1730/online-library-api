import { Controller, Get, UseGuards } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../Auth/jwt-auth-guard';

@Controller('storage')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  getStats() {
    return this.storageService.getStorageStats();
  }
}