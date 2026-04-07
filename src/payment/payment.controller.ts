import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/Auth/role.enum';
import { RolesGuard } from 'src/Auth/roles.guard';
import { Roles } from 'src/Auth/roles.decorator';
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // 1. Endpoint to generate the payment link
  @UseGuards(AuthGuard('jwt'), RolesGuard) // User must be logged in to pay!
  @Roles(Role.STUDENT) // Or whatever roles you allow to pay
  @Post('initiate')
  async initiateCheckout(
    @Request() req,
    @Body('amount') amount: number, // Frontend sends the amount they need to pay
  ) {
    const userId = req.user.id;
    const email = req.user.email;

    return await this.paymentService.initiatePayment(userId, email, amount);
  }

  // 2. Endpoint Pay Changu redirects to on Success
  // Replace your current 'success' endpoint with this:
  @Get('success')
  async paymentSuccess(@Query('tx_ref') txRef: string) {
    // We grab the tx_ref from the URL and pass it to our service
    if (!txRef) {
      return 'No transaction reference provided.';
    }
    return await this.paymentService.verifyPayment(txRef);
  }

  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    // 1. PayChangu sends the transaction status in the 'status' field
    if (data.status === 'success') {
      const transactionId = data.tx_ref; // This matches your library order ID

      console.log(`Payment successful for transaction: ${transactionId}`);

      // 2. logic to unlock the book for the student goes here
      // await this.paymentService.completeOrder(transactionId);
    }

    // 3. Always return a 200 OK so PayChangu knows you got the message
    return { received: true };
  }

  // 3. Endpoint Pay Changu redirects to on Failure/Cancel
  // Replace your current @Get('failed') with this:
  @Get('failed')
  async paymentFailed(@Query('tx_ref') txRef: string) {
    if (!txRef) {
      return 'No transaction reference provided by Pay Changu.';
    }

    // Call the service to update the database!
    return await this.paymentService.markPaymentAsFailed(txRef);
  }
}
