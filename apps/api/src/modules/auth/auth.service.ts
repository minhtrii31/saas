import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

const scrypt = promisify(scryptCallback);

type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

type PrismaKnownError = {
  code?: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ data: PublicUser; meta: Record<string, never> }> {
    const email = this.normalizeEmail(dto.email);
    const password = this.validatePassword(dto.password);
    const name = this.normalizeName(dto.name);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw this.emailAlreadyRegistered();
    }

    const passwordHash = await this.hashPassword(password);
    let user: PublicUser;

    try {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw this.emailAlreadyRegistered();
      }

      throw error;
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      meta: {},
    };
  }

  private normalizeEmail(email: string): string {
    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_EMAIL',
          message: 'Email is required',
        },
        meta: {},
      });
    }

    return email.trim().toLowerCase();
  }

  private validatePassword(password: string): string {
    if (typeof password !== 'string' || password.length === 0) {
      throw new BadRequestException({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password is required',
        },
        meta: {},
      });
    }

    return password;
  }

  private normalizeName(name?: string): string | null {
    if (typeof name !== 'string') {
      return null;
    }

    const trimmedName = name.trim();
    return trimmedName.length > 0 ? trimmedName : null;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as PrismaKnownError).code === 'P2002'
    );
  }

  private emailAlreadyRegistered(): ConflictException {
    return new ConflictException({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email is already registered',
      },
      meta: {},
    });
  }
}
