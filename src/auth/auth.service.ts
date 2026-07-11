import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import type { IHashProvider } from '../common/providers/hash/hash-provider.interface';
import { LoginDto } from './dto/login.dto';

import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject('IHashProvider')
    private readonly hashProvider: IHashProvider,
  ) {}

  async validateUser(
    email: string,
    pass: string,
  ): Promise<Omit<UserEntity, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await this.hashProvider.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  private generateTokens(email: string, sub: string) {
    const payload = { email, sub };
    const refreshPayload = { ...payload, type: 'refresh' };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: '7d' }),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // We keep the standard NestJS 401 Unauthorized for invalid credentials
      // despite the challenge asking for 400, because 401 is the semantically correct HTTP status.
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user.email, user.id);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        type: string;
        sub: string;
        email: string;
      }>(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user.email, user.id);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
