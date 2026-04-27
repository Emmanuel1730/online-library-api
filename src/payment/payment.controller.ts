import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // POST /api/payment/create-checkout-session
  // Called by Books.jsx when student clicks "Buy"
  // Body: { resourceId: string, amount: number }
  // ─────────────────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Request() req,
    @Body('resourceId') resourceId: string,
    @Body('amount') amount: number,
  ) {
    const { id: userId, email } = req.user;
    return this.paymentService.initiatePayment(userId, email, amount, resourceId);
    // Returns: { message, checkoutUrl, transactionReference }
    // Frontend reads checkoutUrl and redirects: window.location.href = data.checkoutUrl
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/payment/initiate  (kept for Postman / direct use)
  // ─────────────────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Post('initiate')
  async initiateCheckout(
    @Request() req,
    @Body('amount') amount: number,
    @Body('resourceId') resourceId?: string,
  ) {
    const { id: userId, email } = req.user;
    return this.paymentService.initiatePayment(userId, email, amount, resourceId);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /api/payment/success?tx_ref=LIB-xxx
  // PayChangu redirects the USER'S BROWSER here after a successful payment.
  // We verify the payment then redirect the browser to the frontend.
  // ─────────────────────────────────────────────────────────────────
  @Get('success')
  async paymentSuccess(
    @Query('tx_ref') txRef: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    if (!txRef) {
      return res.redirect(`${frontendUrl}/payment/result?status=error&message=missing_tx_ref`);
    }

    const result = await this.paymentService.verifyPayment(txRef);

    // Redirect browser back to the React app with the result as query params
    if (result.message?.includes('verified successfully')) {
      return res.redirect(
        `${frontendUrl}/payment/result?status=success&tx_ref=${txRef}&resourceId=${result.resourceId ?? ''}`,
      );
    } else {
      return res.redirect(
        `${frontendUrl}/payment/result?status=pending&tx_ref=${txRef}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /api/payment/failed?tx_ref=LIB-xxx
  // PayChangu redirects the USER'S BROWSER here if they cancel.
  // ─────────────────────────────────────────────────────────────────
  @Get('failed')
  async paymentFailed(
    @Query('tx_ref') txRef: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    if (txRef) {
      await this.paymentService.markPaymentAsFailed(txRef);
    }

    return res.redirect(
      `${frontendUrl}/payment/result?status=failed&tx_ref=${txRef ?? ''}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // POST /api/payment/webhook
  // PayChangu's SERVER calls this silently in the background.
  // Must return 200 quickly — no auth guard needed (PayChangu has no JWT).
  // ─────────────────────────────────────────────────────────────────
  @Post('webhook')
  async handleWebhook(@Body() data: any) {
    return this.paymentService.processWebhook(data);
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /api/payment/my-purchases
  // Returns the list of resourceIds the logged-in user has purchased.
  // Books.jsx calls this on load to know which books to unlock.
  // ─────────────────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Get('my-purchases')
  async getMyPurchases(@Request() req) {
    const resourceIds = await this.paymentService.getUserPurchasedResources(req.user.id);
    return { purchased: resourceIds };
  }

  // ─────────────────────────────────────────────────────────────────
  // GET /api/payment/has-access?resourceId=xxx
  // Per-resource access check for individual book pages.
  // ─────────────────────────────────────────────────────────────────
  @UseGuards(AuthGuard('jwt'))
  @Get('has-access')
  async hasAccess(
    @Request() req,
    @Query('resourceId') resourceId: string,
  ) {
    const access = await this.paymentService.hasUserPurchasedResource(
      req.user.id,
      resourceId,
    );
    return { hasAccess: access };
  }
}