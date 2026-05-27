import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { BookPurchase } from './book-purchase.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(BookPurchase)
    private bookPurchaseRepository: Repository<BookPurchase>,
  ) {}

  async initiatePayment(
    userId: number,
    email: string,
    amount: number,
    resourceId?: string,
    callbackUrl?: string,
    returnUrl?: string,
  ) {
    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');
    if (!secretKey) {
      throw new HttpException(
        'Payment gateway not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const txRef = `LIB-${Date.now()}-${userId}`;

    const newPayment = this.paymentRepository.create({
      userId,
      amount,
      transactionReference: txRef,
      status: PaymentStatus.PENDING,
      resourceId: resourceId ?? undefined,
    });
    await this.paymentRepository.save(newPayment);

    const baseUrl = this.configService.get<string>('APP_BASE_URL');

    // Both callback and return go to the backend /payment/success
    // The backend verifies then redirects the browser to the frontend
    const payload = {
      amount,
      currency: 'MWK',
      email,
      first_name: 'Library',
      last_name: 'Member',
      callback_url: callbackUrl ?? `${baseUrl}/payment/success`,
      return_url:   returnUrl   ?? `${baseUrl}/payment/success`,
      tx_ref: txRef,
      webhook_url: `${baseUrl}/payment/webhook`,
      meta: resourceId ? { resourceId } : undefined,
    };

    try {
      const response = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          message: 'Payment link generated successfully',
          checkoutUrl: data.data.checkout_url,
          transactionReference: txRef,
        };
      } else {
        throw new HttpException(
          data.message || 'Payment initiation failed',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error('Pay Changu Error:', error);
      throw new HttpException(
        error.response || 'Could not connect to payment gateway',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyPayment(txRef: string) {
    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');

    try {
      const response = await fetch(
        `https://api.paychangu.com/verify-payment/${txRef}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${secretKey}`,
          },
        },
      );

      const data = await response.json();
      console.log('--- Pay Changu Verify Response ---', data);

      const payment = await this.paymentRepository.findOne({
        where: { transactionReference: txRef },
      });

      if (!payment) {
        return { message: 'Payment not found in our database.' };
      }

      const isSuccessful =
        data.status === 'success' &&
        data.data &&
        (data.data.status === 'success' || data.data.status === 'successful');

      if (isSuccessful) {
        payment.status = PaymentStatus.SUCCESS;
        await this.paymentRepository.save(payment);

        if (payment.resourceId) {
          await this.grantBookAccess(
            payment.userId,
            payment.resourceId,
            txRef,
            Number(payment.amount),
          );
        }

        return {
          message: 'Payment verified successfully!',
          transaction: txRef,
          resourceId: payment.resourceId ?? null,
        };
      } else {
        return {
          message: 'Payment is still pending or not completed.',
          payChanguSaid: data.message || 'No message provided',
        };
      }
    } catch (error) {
      console.error('--- Verification Crashed ---', error);
      return {
        message: 'Something went wrong verifying the payment.',
        error: error.message,
      };
    }
  }

  async grantBookAccess(
    userId: number,
    resourceId: string,
    txRef: string,
    amount: number,
  ) {
    const existing = await this.bookPurchaseRepository.findOne({
      where: { userId, resourceId },
    });

    if (existing) {
      console.log(`ℹ️  User ${userId} already owns resource ${resourceId}.`);
      return;
    }

    const purchase = this.bookPurchaseRepository.create({
      userId,
      resourceId,
      transactionReference: txRef,
      amountPaid: amount,
      currency: 'MWK',
    });

    await this.bookPurchaseRepository.save(purchase);
    console.log(`✅ Access granted: user ${userId} → resource ${resourceId}`);
  }

  async hasUserPurchasedResource(
    userId: number,
    resourceId: string,
  ): Promise<boolean> {
    const purchase = await this.bookPurchaseRepository.findOne({
      where: { userId, resourceId },
    });
    return !!purchase;
  }

  async getUserPurchasedResources(userId: number): Promise<string[]> {
    const purchases = await this.bookPurchaseRepository.find({
      where: { userId },
    });
    return purchases.map((p) => p.resourceId);
  }

  async processWebhook(payload: any) {
    console.log('--- WEBHOOK RECEIVED FROM PAY CHANGU ---', payload);

    const txRef = payload?.tx_ref ?? payload?.data?.tx_ref;
    const status = payload?.status ?? payload?.data?.status;

    if (!txRef) {
      return { status: 'ignored', message: 'No transaction reference found' };
    }

    const payment = await this.paymentRepository.findOne({
      where: { transactionReference: txRef },
    });

    if (!payment) {
      console.log(`Webhook Error: Payment ${txRef} not found in DB.`);
      return { status: 'error', message: 'Payment not found' };
    }

    if (status === 'success' || status === 'successful') {
      payment.status = PaymentStatus.SUCCESS;
      await this.paymentRepository.save(payment);

      if (payment.resourceId) {
        await this.grantBookAccess(
          payment.userId,
          payment.resourceId,
          txRef,
          Number(payment.amount),
        );
      }

      console.log(`✅ Payment ${txRef} → SUCCESS via Webhook`);
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
      console.log(`❌ Payment ${txRef} → FAILED via Webhook`);
    }

    return { status: 'success', message: 'Webhook processed' };
  }

  async markPaymentAsFailed(txRef: string) {
    console.log(`--- User Cancelled/Failed Payment: ${txRef} ---`);

    const payment = await this.paymentRepository.findOne({
      where: { transactionReference: txRef },
    });

    if (!payment) {
      return { message: 'Payment not found.' };
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentRepository.save(payment);

    return {
      message: 'Payment was cancelled or failed. Your database has been updated.',
      transaction: txRef,
    };
  }

  async initiateSchoolPayment(
    schoolId: string,
    email: string,
    amount: number,
  ) {
    const baseUrl = this.configService.get<string>('APP_BASE_URL');

    const callbackUrl = `${baseUrl}/payment/success`;
    const returnUrl   = `${baseUrl}/payment/success`;

    return this.initiatePayment(
      0,
      email,
      amount,
      schoolId,
      callbackUrl,
      returnUrl,
    );
  }
}