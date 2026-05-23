import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('POST /cvs/:id/rewrite/refine', () => {
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

  it('creates a rewrite refinement analysis for an owned CV with extracted text', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const analysisId = '2f8d69b3-9274-496d-a9a4-2df643f0fe9b';
    const createdAt = new Date('2026-05-23T10:30:00.000Z');
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
      .post(`/cvs/${cvId}/rewrite/refine`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        original: 'Responsible for APIs and helped with database work.',
        currentRewrite: 'Delivered API improvements.',
        instruction: 'more-technical',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: analysisId,
        cvId,
        type: 'REWRITE_REFINEMENT',
        aiProvider: 'mock',
        aiModel: 'mock-resume-rewrite-v1',
        result: {
          improved: expect.any(String),
          reason: expect.any(String),
        },
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });
    expect(response.body.data.result.improved).toContain('TypeScript');
    expect(prisma.cvAnalysis.create).toHaveBeenCalledWith({
      data: {
        cvId,
        type: 'REWRITE_REFINEMENT',
        aiProvider: 'mock',
        aiModel: 'mock-resume-rewrite-v1',
        result: {
          improved: expect.any(String),
          reason: expect.any(String),
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

  it('requires currentRewrite', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-23T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite/refine`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        original: 'Helped with APIs.',
        instruction: 'stronger',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'currentRewrite is required',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
  });

  it('rejects unsupported refinement instructions', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-23T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/rewrite/refine`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        original: 'Helped with APIs.',
        currentRewrite: 'Delivered API improvements.',
        instruction: 'friendlier',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'instruction must be one of stronger, shorter, more-technical, more-leadership, more-ats-friendly, more-results-focused',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
  });
});
