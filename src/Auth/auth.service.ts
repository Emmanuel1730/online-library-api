import {
  Injectable,
  Inject,
  forwardRef,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileService } from '../Profile/profile.service';
import * as crypto from 'crypto';
import { UserRole } from '../Profile/profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private profileService: ProfileService,
    private jwtService: JwtService,
  ) {}

  // LOGIN FIXED
  async login(email: string, pass: string) {
    const user = await this.profileService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await this.profileService.validatePassword(
      pass,
      user.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const schoolId: string | null = user.school?.id ?? null;

    if (user.role !== UserRole.ADMIN && !schoolId) {
      throw new UnauthorizedException('User has no associated school');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      schoolId,
    );

    await this.profileService.updateProfile(user.id, {
      refreshToken: tokens.refresh_token,
    });

    return {
      ...tokens,
      user,
    };
  }

  // REGISTER (already safe because service hashes password)
  async register(signUpDto: any) {
    const userExists = await this.profileService.findByEmail(
      signUpDto.email,
    );

    if (userExists) {
      throw new ConflictException('User already exists');
    }

    const savedUser =
      await this.profileService.createProfile(signUpDto);

    const schoolId: string | null = savedUser.school?.id ?? null;

    if (savedUser.role !== UserRole.ADMIN && !schoolId) {
      throw new UnauthorizedException('User must belong to a school');
    }

    const tokens = await this.generateTokens(
      savedUser.id,
      savedUser.email,
      savedUser.role,
      schoolId,
    );

    await this.profileService.updateProfile(savedUser.id, {
      refreshToken: tokens.refresh_token,
    });

    return {
      ...tokens,
      user: savedUser,
    };
  }

  async generateTokens(
    userId: number,
    email: string,
    role: string,
    schoolId: string | null,
  ) {
    const payload: any = {
      sub: userId,
      email,
      role,
    };

    if (schoolId) payload.schoolId = schoolId;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '1h',
        secret: process.env.JWT_SECRET || 'MY_SUPER_SECRET_KEY_123',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret:
          process.env.JWT_REFRESH_SECRET ||
          'your-refresh-secret-key',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(userId: number, refreshToken: string) {
    const user =
      await this.profileService.getProfileWithRequests(userId);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const schoolId: string | null = user.school?.id ?? null;

    return this.generateTokens(
      user.id,
      user.email,
      user.role,
      schoolId,
    );
  }

  async logout(userId: number) {
    await this.profileService.updateProfile(userId, {
      refreshToken: null,
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.profileService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('No account found');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.profileService.updateProfile(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    return {
      message: 'Reset token generated',
      resetToken,
    };
  }

  // FIXED RESET PASSWORD (hashed)
  async resetPassword(token: string, newPassword: string) {
    const user =
      await this.profileService.findByResetToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.profileService.updateProfile(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return {
      message: 'Password reset successful',
    };
  }
}