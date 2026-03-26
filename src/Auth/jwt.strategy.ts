import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // <--- ADD THIS IMPORT

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Add the "||" fallback to satisfy TypeScript
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'MY_SUPER_SECRET_KEY_123',
    });
  }

  // This function automatically decodes the token and attaches the info to req.user
  async validate(payload: any) {
    console.log('Token Payload received:', payload);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
