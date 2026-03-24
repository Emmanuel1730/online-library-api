import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Settings } from './settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])], // This line is crucial!
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
