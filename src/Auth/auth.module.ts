import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfileModule } from '../Profile/profile.module'; // To check the DB for users

@Module({
  imports: [
    ProfileModule, // We need to read profiles to see if the user exists
    JwtModule.register({
      global: true,
      secret: 'MY_SUPER_SECRET_KEY_123', // In production, this goes in a .env file!
      signOptions: { expiresIn: '1h' }, // Token expires in 1 hour
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
