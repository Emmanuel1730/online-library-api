import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { Request } from './request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Request])], // Connects the Request table
  controllers: [RequestController], // Handles the /requests routes
  providers: [RequestService], // Handles the logic
})
export class RequestModule {}
