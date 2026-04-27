import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { School } from './school.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([School]),
  ],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}