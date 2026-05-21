// ../resources/resources.module.ts

import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resource } from './resources.entity';
import { Upload } from '../uploads/uploads.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { School } from '../school/school.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource, Upload, School]), 
    SupabaseModule,
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
})
export class ResourcesModule {}