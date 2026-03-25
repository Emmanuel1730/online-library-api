import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  // We bring in the JwtService to mathematically verify the token
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Look for the "Authorization" header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Access Denied: No token provided!');
    }

    // 2. Extract the token (It usually looks like "Bearer eyJhbG...")
    const token = authHeader.split(' ')[1];

    try {
      // 3. Verify the token using your secret key!
      // (This MUST match the secret in your auth.module.ts)
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'MY_SUPER_SECRET_KEY_123',
      });

      // 4. Attach the user's data to the request so the rest of the app can see it
      request['user'] = payload;

      // 5. Finally, check if they are an ADMIN
      if (payload.role === 'ADMIN') {
        return true; // The bouncer opens the door!
      } else {
        throw new ForbiddenException('Access Denied: You must be an Admin!');
      }
    } catch (error) {
      // If the token is fake, expired, or tampered with, kick them out
      throw new UnauthorizedException(
        'Access Denied: Invalid or expired token!',
      );
    }
  }
}
