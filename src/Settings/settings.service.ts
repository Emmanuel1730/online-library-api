import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  // Get the single settings row (ID: 1). If it doesn't exist, create it.
  async getSettings(): Promise<Settings> {
    let settings = await this.settingsRepository.findOneBy({ id: 1 });

    if (!settings) {
      const defaultSettings = this.settingsRepository.create({ id: 1 });
      settings = await this.settingsRepository.save(defaultSettings);
    }

    return settings;
  }

  // Update the settings
  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    await this.settingsRepository.update(1, data); // Always update ID 1
    return this.getSettings();
  }
}
