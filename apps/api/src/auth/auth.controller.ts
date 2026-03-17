import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

class RegisterPublicKeyDto {
  userId: string;
  publicKey: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register-key')
  async registerPublicKey(@Body() dto: RegisterPublicKeyDto) {
    await this.authService.registerPublicKey(dto.userId, dto.publicKey);
    return { success: true };
  }

  @Post('logout')
  async logout(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      await this.authService.revokeSession(token);
    }
    return { success: true };
  }

  @Get('verify')
  async verify(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
