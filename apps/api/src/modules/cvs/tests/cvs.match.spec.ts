import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('POST /cvs/:id/match', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
    cv: {
      findFirst: jest.Mock;
    };
    cvAnalysis: {
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
        findFirst: jest.fn(),
      },
      cvAnalysis: {
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

  it('creates a mock JD match analysis for an owned CV with extracted text', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const analysisId = '2f8d69b3-9274-496d-a9a4-2df643f0fe9a';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const jobDescriptionText =
      'We need a backend engineer with TypeScript, NestJS, PostgreSQL, Redis, and API testing experience.';
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
        jobDescriptionText: data.jobDescriptionText,
        aiProvider: data.aiProvider,
        aiModel: data.aiModel,
        result: data.result,
        createdAt,
      }),
    );

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/match`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ jobDescriptionText })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: analysisId,
        cvId,
        type: 'JD_MATCH',
        jobDescriptionText,
        aiProvider: 'mock',
        aiModel: 'mock-jd-matcher-v1',
        result: {
          matchingScore: expect.any(Number),
          matchedSkills: expect.any(Array),
          missingSkills: expect.any(Array),
          suggestions: expect.any(Array),
        },
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });
    expect(response.body.data.result.matchingScore).toBeGreaterThanOrEqual(0);
    expect(response.body.data.result.matchingScore).toBeLessThanOrEqual(100);
    expect(response.body.data.result.matchedSkills).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    expect(response.body.data.result.missingSkills).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    expect(response.body.data.result.suggestions).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
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
        type: 'JD_MATCH',
        jobDescriptionText,
        aiProvider: 'mock',
        aiModel: 'mock-jd-matcher-v1',
        result: {
          matchingScore: expect.any(Number),
          matchedSkills: expect.arrayContaining([expect.any(String)]),
          missingSkills: expect.arrayContaining([expect.any(String)]),
          suggestions: expect.arrayContaining([expect.any(String)]),
        },
      },
      select: {
        id: true,
        cvId: true,
        type: true,
        jobDescriptionText: true,
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
      .post(`/cvs/${cvId}/match`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ jobDescriptionText: 'Backend TypeScript role' })
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
      .post(`/cvs/${cvId}/match`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ jobDescriptionText: 'Backend TypeScript role' })
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

  it('requires jobDescriptionText', async () => {
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
      .post(`/cvs/${cvId}/match`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'jobDescriptionText is required',
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
      .post('/cvs/not-a-uuid/match')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ jobDescriptionText: 'Backend TypeScript role' })
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
      .post('/cvs/57db9a57-197d-40b5-8be5-5a5dfe398912/match')
      .send({ jobDescriptionText: 'Backend TypeScript role' })
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
