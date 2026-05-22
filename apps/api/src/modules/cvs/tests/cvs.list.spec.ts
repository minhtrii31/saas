import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('GET /cvs', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
    cv: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      cv: {
        findMany: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    tokenService = app.get(TokenService);
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app.close();
  });

  it('lists non-deleted CVs owned by the authenticated user in newest-first order', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const olderCreatedAt = new Date('2026-05-21T10:30:00.000Z');
    const newerCreatedAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt: olderCreatedAt,
    });
    prisma.cv.findMany.mockResolvedValue([
      {
        id: '57db9a57-197d-40b5-8be5-5a5dfe398912',
        title: 'Newest CV',
        originalName: 'newest-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123456,
        storageProvider: 's3',
        storageKey: 'users/ada/newest-cv.pdf',
        storageUrl: 'https://storage.example.com/users/ada/newest-cv.pdf',
        extractedText: null,
        createdAt: newerCreatedAt,
      },
      {
        id: '88b07560-ae22-431e-9213-f85c82d25637',
        title: 'Older CV',
        originalName: 'older-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 456789,
        storageProvider: 's3',
        storageKey: 'users/ada/older-cv.pdf',
        storageUrl: null,
        extractedText: null,
        createdAt: olderCreatedAt,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/cvs')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: '57db9a57-197d-40b5-8be5-5a5dfe398912',
          title: 'Newest CV',
          originalName: 'newest-cv.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 123456,
          storageProvider: 's3',
          storageKey: 'users/ada/newest-cv.pdf',
          storageUrl: 'https://storage.example.com/users/ada/newest-cv.pdf',
          extractedText: null,
          createdAt: newerCreatedAt.toISOString(),
        },
        {
          id: '88b07560-ae22-431e-9213-f85c82d25637',
          title: 'Older CV',
          originalName: 'older-cv.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 456789,
          storageProvider: 's3',
          storageKey: 'users/ada/older-cv.pdf',
          storageUrl: null,
          extractedText: null,
          createdAt: olderCreatedAt.toISOString(),
        },
      ],
      meta: {},
    });
    expect(prisma.cv.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        storageProvider: true,
        storageKey: true,
        storageUrl: true,
        extractedText: true,
        createdAt: true,
      },
    });
  });

  it('rejects unauthenticated access', async () => {
    const response = await request(app.getHttpServer()).get('/cvs').expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.cv.findMany).not.toHaveBeenCalled();
  });
});
