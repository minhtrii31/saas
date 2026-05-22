import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('GET /cvs/:id/analyses', () => {
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
        findFirst: jest.fn(),
      },
      cvAnalysis: {
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

  it('lists non-deleted analyses for an owned CV in newest-first order', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const newerCreatedAt = new Date('2026-05-22T10:30:00.000Z');
    const olderCreatedAt = new Date('2026-05-21T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt: newerCreatedAt,
    });
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
    });
    prisma.cvAnalysis.findMany.mockResolvedValue([
      {
        id: '2f8d69b3-9274-496d-a9a4-2df643f0fe9a',
        cvId,
        type: 'CV_ANALYSIS',
        jobDescriptionText: null,
        aiProvider: 'mock',
        aiModel: 'mock-cv-analyzer-v1',
        result: {
          score: 86,
          strengths: ['Clear backend experience'],
          weaknesses: ['Missing impact metrics'],
          suggestions: ['Add measurable outcomes'],
        },
        createdAt: newerCreatedAt,
      },
      {
        id: '519c98ce-49d3-41be-983f-7f1e5a52807f',
        cvId,
        type: 'JD_MATCH',
        jobDescriptionText: 'NestJS and PostgreSQL backend role',
        aiProvider: 'mock',
        aiModel: 'mock-cv-analyzer-v1',
        result: {
          score: 72,
          matchedSkills: ['NestJS', 'PostgreSQL'],
          missingSkills: ['Redis'],
          suggestions: ['Add Redis project experience'],
        },
        createdAt: olderCreatedAt,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get(`/cvs/${cvId}/analyses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: '2f8d69b3-9274-496d-a9a4-2df643f0fe9a',
          cvId,
          type: 'CV_ANALYSIS',
          jobDescriptionText: null,
          aiProvider: 'mock',
          aiModel: 'mock-cv-analyzer-v1',
          result: {
            score: 86,
            strengths: ['Clear backend experience'],
            weaknesses: ['Missing impact metrics'],
            suggestions: ['Add measurable outcomes'],
          },
          createdAt: newerCreatedAt.toISOString(),
        },
        {
          id: '519c98ce-49d3-41be-983f-7f1e5a52807f',
          cvId,
          type: 'JD_MATCH',
          jobDescriptionText: 'NestJS and PostgreSQL backend role',
          aiProvider: 'mock',
          aiModel: 'mock-cv-analyzer-v1',
          result: {
            score: 72,
            matchedSkills: ['NestJS', 'PostgreSQL'],
            missingSkills: ['Redis'],
            suggestions: ['Add Redis project experience'],
          },
          createdAt: olderCreatedAt.toISOString(),
        },
      ],
      meta: {},
    });
    expect(prisma.cv.findFirst).toHaveBeenCalledWith({
      where: {
        id: cvId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    expect(prisma.cvAnalysis.findMany).toHaveBeenCalledWith({
      where: {
        cvId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
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
      .get(`/cvs/${cvId}/analyses`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'CV_NOT_FOUND',
        message: 'CV not found',
      },
      meta: {},
    });
    expect(prisma.cvAnalysis.findMany).not.toHaveBeenCalled();
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
      .get('/cvs/not-a-uuid/analyses')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed (uuid is expected)',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.findMany).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated access', async () => {
    const response = await request(app.getHttpServer())
      .get('/cvs/57db9a57-197d-40b5-8be5-5a5dfe398912/analyses')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.findMany).not.toHaveBeenCalled();
  });
});
