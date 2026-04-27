import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './payment.entity';
import { BookPurchase } from './book-purchase.entity';

@Module({
  imports: [
    ConfigModule,                                      // makes ConfigService injectable
    TypeOrmModule.forFeature([Payment, BookPurchase]), // registers both entities
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}