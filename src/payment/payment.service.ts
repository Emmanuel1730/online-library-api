import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { Repository } from 'typeorm';
@Injectable()
export class PaymentService {
  constructor(
    private configService: ConfigService,
    // Inject the database connection here:
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async initiatePayment(userId: number, email: string, amount: number) {
    // 1. Grab the secret key from .env
    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');
    console.log('My Secret Key is:', secretKey);
    // Safety check: ensure .env is actually loaded
    if (!secretKey) {
      throw new HttpException(
        'Payment gateway not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const txRef = `LIB-${Date.now()}-${userId}`;

    const newPayment = this.paymentRepository.create({
      userId: userId,
      amount: amount,
      transactionReference: txRef,
      status: PaymentStatus.PENDING,
    });
    await this.paymentRepository.save(newPayment);

    // 2. Remove secret_key from here!
    const payload = {
      amount: amount,
      currency: 'MWK',
      email: email,
      first_name: 'Library',
      last_name: 'Member',

      // 1. FRONT DOOR: Where the user's browser goes AFTER paying
      callback_url:
        'https://dibasic-nonvasculous-stanford.ngrok-free.dev/api/payment/success',

      // 2. CANCELLATION DOOR: Where the browser goes if they cancel
      return_url:
        'https://dibasic-nonvasculous-stanford.ngrok-free.dev/api/payment/failed',

      tx_ref: txRef,

      // 3. BACK DOOR: Where Pay Changu's server secretly sends the POST data
      webhook_url:
        'https://dibasic-nonvasculous-stanford.ngrok-free.dev/api/payment/webhook',
    };

    try {
      const response = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          // 3. Add it to the Authorization Header here!
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
        // If Pay Changu rejects it, send their exact error message to Postman
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

  // Add this inside PaymentService
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

      // 1. Let's force it to print everything so we aren't guessing
      console.log('--- Pay Changu Response ---', data);

      const payment = await this.paymentRepository.findOne({
        where: { transactionReference: txRef },
      });

      if (!payment) {
        return { message: 'Payment not found in our database.' };
      }

      // 2. BULLETPROOF CHECK: Only look for data.data.status IF data.data actually exists!
      const isSuccessful =
        data.status === 'success' &&
        data.data &&
        (data.data.status === 'success' || data.data.status === 'successful');

      if (isSuccessful) {
        payment.status = PaymentStatus.SUCCESS;
        await this.paymentRepository.save(payment);
        return {
          message: 'Payment verified successfully!',
          transaction: txRef,
        };
      } else {
        // We won't mark it FAILED right away in case it's just delayed
        return {
          message: 'Payment is still pending or not completed.',
          payChanguSaid: data.message || 'No message provided',
        };
      }
    } catch (error) {
      // 3. Catch the exact error if it crashes again
      console.error('--- Verification Crashed ---', error);
      return {
        message: 'Something went wrong verifying the payment.',
        error: error.message,
      };
    }
  }
  // Add this inside PaymentService
  async markPaymentAsFailed(txRef: string) {
    console.log(`--- User Cancelled/Failed Payment: ${txRef} ---`);

    const payment = await this.paymentRepository.findOne({
      where: { transactionReference: txRef },
    });

    if (!payment) {
      return { message: 'Payment not found.' };
    }

    // Update the database to FAILED
    payment.status = PaymentStatus.FAILED;
    await this.paymentRepository.save(payment);

    return {
      message:
        'Payment was cancelled or failed. Your database has been updated.',
      transaction: txRef,
    };
  }

  // Add this inside PaymentService
  async processWebhook(payload: any) {
    console.log('--- WEBHOOK RECEIVED FROM PAY CHANGU ---', payload);

    // Pay Changu sends the transaction reference inside the payload
    // Depending on their exact format, it might be payload.tx_ref or payload.data.tx_ref
    const txRef = payload?.tx_ref || payload?.data?.tx_ref;
    const status = payload?.status || payload?.data?.status;

    // If there is no transaction reference, just ignore it
    if (!txRef) {
      return { status: 'ignored', message: 'No transaction reference found' };
    }

    // 1. Find the payment in our database
    const payment = await this.paymentRepository.findOne({
      where: { transactionReference: txRef },
    });

    if (!payment) {
      console.log(`Webhook Error: Payment ${txRef} not found in DB.`);
      return { status: 'error', message: 'Payment not found' };
    }

    // 2. Update the status based on what Pay Changu tells us
    if (status === 'success' || status === 'successful') {
      payment.status = PaymentStatus.SUCCESS;
      console.log(
        `✅ Payment ${txRef} successfully updated to SUCCESS via Webhook!`,
      );
    } else {
      payment.status = PaymentStatus.FAILED;
      console.log(`❌ Payment ${txRef} marked as FAILED via Webhook.`);
    }

    // 3. Save the new status to the database!
    await this.paymentRepository.save(payment);

    // 4. Always return a 200 OK so Pay Changu knows we received the message
    return { status: 'success', message: 'Webhook processed' };
  }
  async completeOrder(txRef: string) {
    // 1. Find the pending payment in the database using the tx_ref
    const payment = await this.paymentRepository.findOne({
      where: { transactionReference: txRef },
    });

    if (payment) {
      // 2. Change the status from PENDING to SUCCESS
      payment.status = PaymentStatus.SUCCESS; // Or whatever your enum/string is

      // 3. Save it back to the database
      await this.paymentRepository.save(payment);
      console.log('Database updated to SUCCESS!');
    }
  }
}
