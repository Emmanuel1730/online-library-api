import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { Profile } from './profile.entity';
import { AuthModule } from '../Auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]), 
    forwardRef(() => AuthModule,
  )], // Connects your database table
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService], //this shares with auth module
})
export class ProfileModule {}
