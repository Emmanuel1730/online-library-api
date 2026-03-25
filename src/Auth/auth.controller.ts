import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.login(signInDto.email, signInDto.password);
  }
  @Post('register')
  async register(@Body() signUpDto: any) {
    const result = await this.authService.register(signUpDto);
    return result;
  }
  @Post('refresh')
  async refreshTokens(@Body() body: any) {
    // We expect the frontend/Postman to send the user's ID and their Refresh Token in the JSON body
    return this.authService.refreshToken(body.userId, body.refreshToken);
  }
}
