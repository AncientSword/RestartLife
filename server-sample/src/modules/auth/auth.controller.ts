import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Public } from '../../common/public.decorator';
import { CurrentUser } from '../../common/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() b: { nickname: string; email: string; password: string }) {
    return this.auth.register(b);
  }

  @Public()
  @Post('login')
  login(@Body() b: { email: string; password: string }) {
    return this.auth.login(b);
  }

  // 小程序登录：code -> openid -> 签发 JWT
  @Public()
  @Post('wx-login')
  wxLogin(@Body() b: { code: string }) {
    return this.auth.wxLogin(b.code);
  }

  @Get('me')
  me(@CurrentUser() user: any) {
    return this.auth.getMe(user.id);
  }
}