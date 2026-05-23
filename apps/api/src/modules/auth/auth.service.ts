import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvironmentService } from '../../config/environment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

type PrismaKnownError = {
  code?: string;
};

type LoginUser = PublicUser & {
  passwordHash: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly environmentService: EnvironmentService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

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

    const passwordHash = await this.passwordService.hash(password);
    let user: PublicUser;

    try {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          creditBalance: this.environmentService.freeStarterCredits,
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

  async login(
    dto: LoginDto,
  ): Promise<{ data: { user: PublicUser; accessToken: string } }> {
    const email = this.normalizeEmail(dto.email);
    const password = this.validatePassword(dto.password);

    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        createdAt: true,
      },
    });

    if (
      !user ||
      !(await this.passwordService.verify(password, user.passwordHash))
    ) {
      throw this.invalidCredentials();
    }

    return {
      data: {
        user: this.toPublicUser(user),
        accessToken: this.tokenService.signAccessToken(user.id),
      },
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

  private toPublicUser(user: LoginUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
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

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
      meta: {},
    });
  }
}
