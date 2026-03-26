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
import * as crypto from 'crypto'; // Built-in Node.js module
import { MoreThan } from 'typeorm';
@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private profileService: ProfileService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    // 1. Find the user in the database
    const user = await this.profileService.findByEmail(email);

    // 2. Check if user exists and password matches
    // (Reminder: use bcrypt.compare() in production!)
    if (!user || user.password !== pass) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Generate BOTH Access and Refresh tokens using the helper
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 4. Save the refresh token to the database (important for security!)
    await this.profileService.updateProfile(user.id, {
      refreshToken: tokens.refresh_token,
    });

    // 5. Return the tokens and the user info
    return {
      ...tokens, // This "unpacks" access_token and refresh_token
      user,
    };
  }

  // Inside your AuthService class
  async register(signUpDto: any) {
    // 1. Check if the user already exists
    const userExists = await this.profileService.findByEmail(signUpDto.email);

    if (userExists) {
      throw new ConflictException('User with this email already exists');
    }

    // 2. Create AND save the profile
    const savedUser = await this.profileService.createProfile(signUpDto);

    // 3. Generate BOTH tokens (Access + Refresh) using your helper function
    const tokens = await this.generateTokens(
      savedUser.id,
      savedUser.email,
      savedUser.role,
    );

    // 4. Save the refresh token to the database so we can verify it later
    await this.profileService.updateProfile(savedUser.id, {
      refreshToken: tokens.refresh_token,
    });

    // 5. Finally, return everything to the user
    return {
      ...tokens,
      user: savedUser,
    };
  }

  // Add this helper function inside your AuthService class
  async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      // 1. The short-lived Access Token (15 minutes)
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET || 'MY_SUPER_SECRET_KEY_123', // Use your standard secret
      }),
      // 2. The long-lived Refresh Token (7 days)
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', // Use a DIFFERENT secret for extra security
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(userId: number, refreshToken: string) {
    // 1. Find the user and their stored refresh token
    const user = await this.profileService.getProfileWithRequests(userId);

    // 2. Check if the token matches what's in the DB
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 3. Generate a new pair of tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // 4. Update the stored refresh token in the database
    await this.profileService.updateProfile(user.id, {
      refreshToken: tokens.refresh_token,
    });

    return tokens;
  }
  // In auth.service.ts
  async logout(userId: number) {
    // 1. Force convert to number just in case
    const id = Number(userId);

    // 2. Perform the update
    const result = await this.profileService.updateProfile(id, {
      refreshToken: null,
    });

    // 3. Log this so you can see it in your terminal!
    console.log(`Logout attempt for ID ${id}:`, result);

    return { message: 'Logged out successfully' };
  }
  async forgotPassword(email: string) {
    // 1. Find the user
    const user = await this.profileService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with that email');
    }

    // 2. Generate a random 20-character hex token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 3. Set expiration for 1 hour from now
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    // 4. Save to database
    await this.profileService.updateProfile(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    });

    // 5. In a real app, you'd send an email here.
    // For testing, we return the token so we can use it for the next step.
    return {
      message: 'Reset token generated successfully',
      resetToken: resetToken, // Copy this from Postman later!
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Ask ProfileService to find the user
    const user = await this.profileService.findByResetToken(token);

    if (!user) {
      throw new UnauthorizedException('Reset token is invalid or has expired');
    }

    // 2. Use your existing updateProfile method to save the new password and clear tokens
    await this.profileService.updateProfile(user.id, {
      password: newPassword, // Note: In a real app, hash this first!
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return { message: 'Password has been reset successfully' };
  }
}
