import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsController } from './request.controller';
import { RequestService } from './request.service';
import { Request } from './request.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request]),
    NotificationModule,
], // Connects the Request table
  controllers: [RequestsController], // Handles the /requests routes
  providers: [RequestService], // Handles the logic
})
export class RequestModule {}
