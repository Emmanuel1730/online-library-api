import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth-guard';
import { CreateProfileDto } from '../Profile/create-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }

  @Post('register')
  async register(@Body() signUpDto: CreateProfileDto) {
    const result = await this.authService.register(signUpDto);
    return result;
  }

  @Post('refresh')
  async refreshTokens(@Body() body: any) {
    return this.authService.refreshToken(body.userId, body.refreshToken);
  }

  @Post('logout')
  async logout(@Body() body: { userId: number }) {
    return await this.authService.logout(body.userId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return await this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.resetPassword(token, newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Body() body: any, @Req() req: any) {
    return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}