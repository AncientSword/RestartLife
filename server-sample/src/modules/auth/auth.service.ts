import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(b: { nickname: string; email: string; password: string }) {
    const passwordHash = await bcrypt.hash(b.password, 10);
    const user = this.users.create({
      nickname: b.nickname,
      email: b.email,
      passwordHash,
    });
    await this.users.save(user);
    return { token: this.sign(user.id), user: this.strip(user) };
  }

  async login(b: { email: string; password: string }) {
    const user = await this.users.findOne({
      where: { email: b.email },
      select: ['id', 'nickname', 'email', 'passwordHash'],
    });
    if (!user || !(await bcrypt.compare(b.password, user.passwordHash))) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    return { token: this.sign(user.id), user: this.strip(user) };
  }

  // 微信小程序：用 code 换 openid，老用户直接签发，新用户自动注册
  async wxLogin(code: string) {
    const openId = await this.exchangeWxCode(code);
    let user = await this.users.findOne({ where: { wxOpenId: openId } });
    if (!user) {
      user = this.users.create({
        wxOpenId: openId,
        nickname: '微信用户',
      });
      await this.users.save(user);
    }
    return { token: this.sign(user.id), user: this.strip(user) };
  }

  async getMe(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException();
    return this.strip(user);
  }

  private sign(userId: string) {
    return this.jwt.sign({ sub: userId });
  }

  private strip(u: User) {
    return { id: u.id, nickname: u.nickname, avatarUrl: u.avatarUrl };
  }

  // 实现参考微信文档：https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html
  private async exchangeWxCode(code: string): Promise<string> {
    // const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
    // const r = await fetch(url).then(r => r.json());
    // return r.openid;
    throw new Error('请填写微信 code2Session 逻辑');
  }
}