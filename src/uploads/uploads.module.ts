import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { Upload } from './uploads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Upload])],
  controllers: [UploadsController],
  providers: [UploadsService, SupabaseService],
})
export class UploadsModule {}