import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    // (You will need to add this findByEmail method to ProfileService)
    const user = await this.profileService.findByEmail(email);

    // 2. Check if user exists and password matches
    // (Note: In a real app, you would use bcrypt.compare() here!)
    if (!user || user.password !== pass) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. If correct, create the JWT "Wristband"
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { id: user.id, role: user.role },
    };
  }
}
