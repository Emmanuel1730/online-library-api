import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Add these
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfileModule } from '../Profile/profile.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    forwardRef(() => ProfileModule),
    // 1. Ensure PassportModule is imported here
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 2. Use registerAsync to ensure .env is loaded first
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  // 3. Now it is safe to export these
  exports: [AuthService, PassportModule, JwtStrategy],
})
export class AuthModule {}
