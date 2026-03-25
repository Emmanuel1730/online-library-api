import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileService } from '../Profile/profile.service';

@Injectable()
export class AuthService {
  constructor(
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
        secret: process.env.JWT_SECRET || 'your-secret-key', // Use your standard secret
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
}
