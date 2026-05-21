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
  @Post(':id/pay')
  pay(@Param('id') id: string, @Body('email') email: string) {
    return this.schoolService.initiateRegistrationPayment(id, email);
  }

  // GET /api/school/payment/success?tx_ref=SCH-xxx
  @Get('payment/success')
  async paymentSuccess(@Query('tx_ref') txRef: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    if (!txRef) return res.redirect(`${frontendUrl}/school/register?step=result&status=error`);
    const success = await this.schoolService.handlePaymentSuccess(txRef);
    return res.redirect(
      success
        ? `${frontendUrl}/school/register?step=result&status=success&tx_ref=${txRef}`
        : `${frontendUrl}/school/register?step=result&status=pending&tx_ref=${txRef}`,
    );
  }

  // GET /api/school/payment/failed?tx_ref=SCH-xxx
  @Get('payment/failed')
  async paymentFailed(@Query('tx_ref') txRef: string, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/school/register?step=result&status=failed&tx_ref=${txRef ?? ''}`);
  }

  // POST /api/school/payment/webhook
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