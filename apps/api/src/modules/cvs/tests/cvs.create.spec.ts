import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('POST /cvs', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
    cv: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      cv: {
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
    configureApp(app);
    await app.init();

    tokenService = app.get(TokenService);
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app.close();
  });

  it('creates CV metadata owned by the authenticated user', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt,
    });
    prisma.cv.create.mockResolvedValue({
      id: '57db9a57-197d-40b5-8be5-5a5dfe398912',
      title: 'Backend CV',
      originalName: 'ada-cv.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 123456,
      storageProvider: 's3',
      storageKey: 'users/ada/ada-cv.pdf',
      storageUrl: 'https://storage.example.com/users/ada/ada-cv.pdf',
      extractedText: null,
      createdAt,
    });

    const response = await request(app.getHttpServer())
      .post('/cvs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Backend CV',
        originalName: 'ada-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123456,
        storageProvider: 's3',
        storageKey: 'users/ada/ada-cv.pdf',
        storageUrl: 'https://storage.example.com/users/ada/ada-cv.pdf',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: '57db9a57-197d-40b5-8be5-5a5dfe398912',
        title: 'Backend CV',
        originalName: 'ada-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123456,
        storageProvider: 's3',
        storageKey: 'users/ada/ada-cv.pdf',
        storageUrl: 'https://storage.example.com/users/ada/ada-cv.pdf',
        extractedText: null,
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });
    expect(prisma.cv.create).toHaveBeenCalledWith({
      data: {
        userId,
        title: 'Backend CV',
        originalName: 'ada-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123456,
        storageProvider: 's3',
        storageKey: 'users/ada/ada-cv.pdf',
        storageUrl: 'https://storage.example.com/users/ada/ada-cv.pdf',
        extractedText: null,
        deletedAt: null,
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
    const response = await request(app.getHttpServer())
      .post('/cvs')
      .send({
        originalName: 'ada-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 123456,
        storageProvider: 's3',
        storageKey: 'users/ada/ada-cv.pdf',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it('rejects invalid mimeType', async () => {
    const accessToken = tokenService.signAccessToken(
      '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
    );

    prisma.user.findFirst.mockResolvedValue({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post('/cvs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalName: 'ada-cv.pdf',
        mimeType: 'not-a-mime-type',
        sizeBytes: 123456,
        storageProvider: 's3',
        storageKey: 'users/ada/ada-cv.pdf',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'mimeType must be MIME type format',
      },
      meta: {},
    });
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it('rejects negative sizeBytes', async () => {
    const accessToken = tokenService.signAccessToken(
      '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
    );

    prisma.user.findFirst.mockResolvedValue({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post('/cvs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalName: 'ada-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: -1,
        storageProvider: 's3',
        storageKey: 'users/ada/ada-cv.pdf',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'sizeBytes must not be less than 0',
      },
      meta: {},
    });
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });
});
