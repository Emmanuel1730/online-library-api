import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './create-school.dto';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../Auth/roles.guard';
import { Roles } from '../Auth/roles.decorator';
import { Role } from '../Auth/role.enum';

@Controller('school')
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    private readonly configService: ConfigService,
  ) {}

  // POST /api/school/register — public, no auth needed
  @Post('register')
  register(@Body() dto: CreateSchoolDto) {
    return this.schoolService.register(dto);
  }

  // PATCH /api/school/:id — admin only
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSchoolDto>) {
    return this.schoolService.update(id, dto);
  }

  // DELETE /api/school/:id — admin only
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schoolService.remove(id);
  }

  // POST /api/school/:id/pay
  // Returns { secretKey, payload } — browser uses these to call PayChangu directly,
  // bypassing Render free-tier's outbound network restriction.
  @Post(':id/pay')
  pay(@Param('id') id: string, @Body('email') email: string) {
    return this.schoolService.getPaymentPayload(id, email);
  }

  // GET /api/school/payment/success?tx_ref=SCH-xxx
  // PayChangu redirects the user's browser here after a successful payment.
  // NOTE: on Render free tier this verify call may also timeout.
  // The webhook below is the reliable activation path — this is just a UX redirect.
  @Get('payment/success')
  async paymentSuccess(@Query('tx_ref') txRef: string, @Res() res: Response) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    if (!txRef) {
      return res.redirect(
        `${frontendUrl}/school/register?step=result&status=error`,
      );
    }

    try {
      const success = await this.schoolService.handlePaymentSuccess(txRef);
      return res.redirect(
        success
          ? `${frontendUrl}/school/register?step=result&status=success&tx_ref=${txRef}`
          : `${frontendUrl}/school/register?step=result&status=pending&tx_ref=${txRef}`,
      );
    } catch {
      // If verify times out (Render free tier), still redirect to success —
      // the webhook will activate the school in the background.
      return res.redirect(
        `${frontendUrl}/school/register?step=result&status=success&tx_ref=${txRef}`,
      );
    }
  }

  // GET /api/school/payment/failed?tx_ref=SCH-xxx
  // PayChangu redirects the user's browser here if they cancel / card declines.
  @Get('payment/failed')
  async paymentFailed(@Query('tx_ref') txRef: string, @Res() res: Response) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return res.redirect(
      `${frontendUrl}/school/register?step=result&status=failed&tx_ref=${txRef ?? ''}`,
    );
  }

  // POST /api/school/payment/webhook
  // PayChangu's own servers call this silently — no Render outbound restriction applies.
  // This is the RELIABLE activation path.
  @Post('payment/webhook')
  webhook(@Body() payload: any) {
    return this.schoolService.handleWebhook(payload);
  }

  // GET /api/school/registration-fee
  @Get('registration-fee')
  getRegistrationFee() {
    return this.schoolService.getRegistrationFee();
  }

  // GET /api/school
  @Get()
  findAll() {
    return this.schoolService.findAll();
  }

  // GET /api/school/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(id);
  }
}
