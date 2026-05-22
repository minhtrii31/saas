import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../token.service';

describe('GET /auth/me', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    tokenService = app.get(TokenService);
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app.close();
  });

  it('returns the current user for a valid bearer access token', async () => {
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(
      '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
    );

    prisma.user.findFirst.mockResolvedValue({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt,
    });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      data: {
        id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        email: 'user@example.com',
        name: 'Ada Lovelace',
        createdAt: createdAt.toISOString(),
      },
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  });

  it('rejects requests without a bearer token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects invalid bearer tokens', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects tokens for soft-deleted users', async () => {
    const accessToken = tokenService.signAccessToken(
      '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
    );

    prisma.user.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
          deletedAt: null,
        },
      }),
    );
  });
});
