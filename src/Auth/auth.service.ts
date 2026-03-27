import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileService } from '../Profile/profile.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private profileService: ProfileService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.profileService.findByEmail(email);

    if (!user || user.password !== pass) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 🔥 IMPORTANT: ensure school is loaded
    if (!user.school) {
      throw new UnauthorizedException('User has no associated school');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.school.id, // ✅ FIX
    );

    await this.profileService.updateProfile(user.id, {
      refreshToken: tokens.refresh_token,
    });

    return {
      ...tokens,
      user,
    };
  }

  async register(signUpDto: any) {
    const userExists = await this.profileService.findByEmail(
      signUpDto.email,
    );

    if (userExists) {
      throw new ConflictException(
        'User with this email already exists',
      );
    }

    const savedUser =
      await this.profileService.createProfile(signUpDto);

    if (!savedUser.school) {
      throw new UnauthorizedException(
        'User must belong to a school',
      );
    }

    const tokens = await this.generateTokens(
      savedUser.id,
      savedUser.email,
      savedUser.role,
      savedUser.school.id, // ✅ FIX
    );

    await this.profileService.updateProfile(savedUser.id, {
      refreshToken: tokens.refresh_token,
    });

    return {
      ...tokens,
      user: savedUser,
    };
  }

  // ✅ UPDATED TOKEN GENERATION
  async generateTokens(
    userId: number,
    email: string,
    role: string,
    schoolId: string, // ✅ NEW
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      schoolId, // ✅ CRITICAL
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET || 'your-secret-key',
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

    if (!user.school) {
      throw new UnauthorizedException('User has no school');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.school.id, // ✅ FIX
    );

    await this.profileService.updateProfile(user.id, {
      refreshToken: tokens.refresh_token,
    });

    return tokens;
  }

  async logout(userId: number) {
    const id = Number(userId);

    const result = await this.profileService.updateProfile(id, {
      refreshToken: null,
    });

    console.log(`Logout attempt for ID ${id}:`, result);

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.profileService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(
        'No account found with that email',
      );
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.profileService.updateProfile(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    return {
      message: 'Reset token generated successfully',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user =
      await this.profileService.findByResetToken(token);

    if (!user) {
      throw new UnauthorizedException(
        'Reset token is invalid or has expired',
      );
    }

    await this.profileService.updateProfile(user.id, {
      password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return {
      message: 'Password has been reset successfully',
    };
  }
}