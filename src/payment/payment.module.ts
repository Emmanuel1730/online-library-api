import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Add this
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from './payment.entity'; // Add this

@Module({
  // Add TypeOrmModule.forFeature([Payment]) here!
  imports: [ConfigModule, TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
