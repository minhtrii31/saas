import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('POST /cvs/:id/rewrite', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    cv: {
      findFirst: jest.Mock;
    };
    cvAnalysis: {
      create: jest.Mock;
    };
    usageRecord: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ creditBalance: 100 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      cv: {
        findFirst: jest.fn(),
      },
      cvAnalysis: {
        create: jest.fn(),
      },
      usageRecord: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
        Promise.resolve(callback(prisma)),
      ),
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

  it('creates a mock resume rewrite analysis for an owned CV with extracted text', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const analysisId = '2f8d69b3-9274-496d-a9a4-2df643f0fe9a';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const originalText = 'Responsible for APIs and helped with database work.';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt,
    });
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
      extractedText:
        'Ada is a backend engineer with TypeScript, NestJS, PostgreSQL, and testing experience.',
    });
    prisma.cvAnalysis.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: analysisId,
        cvId: data.cvId,
        type: data.type,
        aiProvider: data.aiProvider,
        aiModel: data.aiModel,
        result: data.result,
        createdAt,
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalText,
        rewriteGoal: 'stronger-impact',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: analysisId,
        cvId,
        type: 'RESUME_REWRITE',
        aiProvider: 'mock',
        aiModel: 'mock-resume-rewrite-v1',
        result: {
          originalText,
          rewrittenText: expect.any(String),
          explanation: expect.any(String),
          rewriteGoal: 'stronger-impact',
        },
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });
    expect(response.body.data.result.rewrittenText).toContain('Owned');
    expect(prisma.cv.findFirst).toHaveBeenCalledWith({
      where: {
        id: cvId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        extractedText: true,
      },
    });
    expect(prisma.cvAnalysis.create).toHaveBeenCalledWith({
      data: {
        cvId,
        type: 'RESUME_REWRITE',
        aiProvider: 'mock',
        aiModel: 'mock-resume-rewrite-v1',
        result: {
          originalText,
          rewrittenText: expect.any(String),
          explanation: expect.any(String),
          rewriteGoal: 'stronger-impact',
        },
      },
      select: {
        id: true,
        cvId: true,
        type: true,
        aiProvider: true,
        aiModel: true,
        result: true,
        createdAt: true,
      },
    });
  });

  it('returns CV_NOT_FOUND when the CV does not exist, is owned by another user, or is soft-deleted', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });
    prisma.cv.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalText: 'Helped with APIs.',
        rewriteGoal: 'concise',
      })
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'CV_NOT_FOUND',
        message: 'CV not found',
      },
      meta: {},
    });
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('returns CV_TEXT_NOT_EXTRACTED when the owned CV has no extracted text', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
      extractedText: null,
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalText: 'Helped with APIs.',
        rewriteGoal: 'concise',
      })
      .expect(422);

    expect(response.body).toEqual({
      error: {
        code: 'CV_TEXT_NOT_EXTRACTED',
        message: 'CV text has not been extracted',
      },
      meta: {},
    });
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('requires originalText', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rewriteGoal: 'concise' })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'originalText is required',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects unsupported rewrite goals', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalText: 'Helped with APIs.',
        rewriteGoal: 'casual',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'rewriteGoal must be one of stronger-impact, ats-optimization, concise, quantified-achievements, leadership-tone',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects invalid UUID route params', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post('/cvs/not-a-uuid/rewrite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalText: 'Helped with APIs.',
        rewriteGoal: 'concise',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed (uuid is expected)',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated access', async () => {
    const response = await request(app.getHttpServer())
      .post('/cvs/57db9a57-197d-40b5-8be5-5a5dfe398912/rewrite')
      .send({
        originalText: 'Helped with APIs.',
        rewriteGoal: 'concise',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });
});
