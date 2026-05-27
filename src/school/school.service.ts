import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { School, SchoolRegistrationStatus } from './school.entity';
import { Repository } from 'typeorm';
import { CreateSchoolDto } from './create-school.dto';
import { ConfigService } from '@nestjs/config';

const REGISTRATION_FEE = 5000; // ← change this when you decide the price

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private repo: Repository<School>,
    private configService: ConfigService,
  ) {}

  async register(dto: CreateSchoolDto) {
    const school = this.repo.create({
      ...dto,
      registrationStatus: SchoolRegistrationStatus.PENDING_PAYMENT,
    });
    return this.repo.save(school);
  }

  async update(id: string, dto: Partial<CreateSchoolDto>) {
    const school = await this.repo.findOne({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    Object.assign(school, dto);
    return this.repo.save(school);
  }

  async remove(id: string) {
    const school = await this.repo.findOne({ where: { id } });
    if (!school) throw new NotFoundException('School not found');
    await this.repo.delete(id);
    return { message: 'School deleted', id };
  }

  // ── Returns the signed PayChangu payload so the BROWSER can POST it directly.
  // This avoids Render free-tier's outbound network block.
  async getPaymentPayload(schoolId: string, email: string) {
    const school = await this.repo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    if (school.registrationStatus === SchoolRegistrationStatus.ACTIVE) {
      throw new BadRequestException('School is already registered and active');
    }

    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');
    if (!secretKey) throw new BadRequestException('Payment gateway not configured');

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const baseUrl =
      this.configService.get<string>('APP_BASE_URL') ?? 'http://localhost:3000';

    const txRef = `SCH-${Date.now()}-${schoolId.slice(0, 8)}`;

    // Persist txRef so webhook / success handler can look up the school later
    school.registrationTxRef = txRef;
    await this.repo.save(school);

    return {
      secretKey, // browser needs this to call PayChangu — only safe over HTTPS
      payload: {
        amount:       REGISTRATION_FEE,
        currency:     'MWK',
        email,
        first_name:   school.name,
        last_name:    'Registration',
        // PayChangu redirects the user's browser to these URLs after payment
        callback_url: `${frontendUrl}/school/register?step=result&status=success`,
        return_url:   `${frontendUrl}/school/register?step=result&status=failed`,
        tx_ref:       txRef,
        // PayChangu calls this silently from its own servers (no Render restriction)
        webhook_url:  `${baseUrl}/api/school/payment/webhook`,
        meta:         { schoolId },
      },
    };
  }

  // ── Called by GET /school/payment/success (browser redirect from PayChangu) ──
  async handlePaymentSuccess(txRef: string) {
    const secretKey = this.configService.get<string>('PAYCHANGU_SECRET_KEY');
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
    const isSuccessful =
      data.status === 'success' &&
      data.data &&
      (data.data.status === 'success' || data.data.status === 'successful');
    if (isSuccessful) {
      await this.activateSchool(txRef, Number(data.data.amount ?? REGISTRATION_FEE));
    }
    return isSuccessful;
  }

  // ── Called by POST /school/payment/webhook (PayChangu server → your server) ──
  async handleWebhook(payload: any) {
    const txRef  = payload?.tx_ref  ?? payload?.data?.tx_ref;
    const status = payload?.status  ?? payload?.data?.status;
    if (!txRef) return { status: 'ignored' };
    if (status === 'success' || status === 'successful') {
      await this.activateSchool(txRef, Number(payload?.data?.amount ?? REGISTRATION_FEE));
    }
    return { status: 'ok' };
  }

  async activateSchool(txRef: string, amountPaid: number) {
    const school = await this.repo.findOne({ where: { registrationTxRef: txRef } });
    if (!school || school.registrationStatus === SchoolRegistrationStatus.ACTIVE) return;
    school.registrationStatus  = SchoolRegistrationStatus.ACTIVE;
    school.registrationFeePaid = amountPaid;
    await this.repo.save(school);
    console.log(`✅ School "${school.name}" activated`);
  }

  findAll() {
    return this.repo.find({ relations: ['categories', 'resources', 'profiles'] });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ['categories', 'resources', 'profiles'],
    });
  }

  getRegistrationFee() {
    return { amount: REGISTRATION_FEE, currency: 'MWK' };
  }
}
