import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;

@Injectable()
export class TokenService {
  signAccessToken(userId: string): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    const header = this.base64UrlEncode({
      alg: 'HS256',
      typ: 'JWT',
    });
    const payload = this.base64UrlEncode({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    });
    const signature = createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  private base64UrlEncode(value: Record<string, string | number>): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }
}
