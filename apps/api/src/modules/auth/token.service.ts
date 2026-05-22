import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;

type AccessTokenPayload = {
  sub: string;
  exp: number;
};

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

  verifyAccessToken(token: string): AccessTokenPayload | null {
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      return null;
    }

    const expectedSignature = createHmac('sha256', this.getSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (!this.safeEqual(signature, expectedSignature)) {
      return null;
    }

    const decodedPayload = this.decodePayload(payload);

    if (!decodedPayload || decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decodedPayload;
  }

  private base64UrlEncode(value: Record<string, string | number>): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decodePayload(payload: string): AccessTokenPayload | null {
    try {
      const value = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as Partial<AccessTokenPayload>;

      if (typeof value.sub !== 'string' || typeof value.exp !== 'number') {
        return null;
      }

      return {
        sub: value.sub,
        exp: value.exp,
      };
    } catch {
      return null;
    }
  }

  private safeEqual(value: string, expectedValue: string): boolean {
    const valueBuffer = Buffer.from(value);
    const expectedValueBuffer = Buffer.from(expectedValue);

    return (
      valueBuffer.length === expectedValueBuffer.length &&
      timingSafeEqual(valueBuffer, expectedValueBuffer)
    );
  }

  private getSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    return secret;
  }
}
