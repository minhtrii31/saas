import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('GET /cvs/:id/progress', () => {
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

  it('returns progress trends for an owned CV', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
    });
    prisma.cvAnalysis.findMany.mockResolvedValue([
      {
        id: 'analysis-1',
        type: 'CV_ANALYSIS',
        result: {
          score: 68,
          scoringCategories: {
            atsReadiness: 61,
            readability: 70,
            impact: 55,
            keywordOptimization: 58,
            structure: 72,
            experienceQuality: 66,
          },
        },
        createdAt: new Date('2026-05-18T10:00:00.000Z'),
      },
      {
        id: 'rewrite-1',
        type: 'RESUME_REWRITE',
        result: {},
        createdAt: new Date('2026-05-20T10:00:00.000Z'),
      },
      {
        id: 'analysis-2',
        type: 'CV_ANALYSIS',
        result: {
          score: 80,
          scoringCategories: {
            atsReadiness: 73,
            readability: 78,
            impact: 68,
            keywordOptimization: 76,
            structure: 82,
            experienceQuality: 80,
          },
        },
        createdAt: new Date('2026-05-22T10:00:00.000Z'),
      },
    ]);

    const response = await request(app.getHttpServer())
      .get(`/cvs/${cvId}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      data: expect.objectContaining({
        cvId,
        scoreTimeline: [
          {
            analysisId: 'analysis-1',
            createdAt: '2026-05-18T10:00:00.000Z',
            score: 68,
          },
          {
            analysisId: 'analysis-2',
            createdAt: '2026-05-22T10:00:00.000Z',
            score: 80,
          },
        ],
        atsTrend: [
          {
            analysisId: 'analysis-1',
            createdAt: '2026-05-18T10:00:00.000Z',
            score: 61,
          },
          {
            analysisId: 'analysis-2',
            createdAt: '2026-05-22T10:00:00.000Z',
            score: 73,
          },
        ],
        rewriteActivityTrend: [
          {
            date: '2026-05-20',
            total: 1,
            resumeRewrite: 1,
            rewriteRefinement: 0,
          },
        ],
        improvementDeltas: {
          score: 12,
          atsReadiness: 12,
          keywordOptimization: 18,
          impact: 13,
        },
        summary: expect.objectContaining({
          earliestScore: 68,
          latestScore: 80,
          latestScoreVsEarliestScore: 12,
          totalScoreAnalyses: 2,
          totalRewriteActions: 1,
        }),
      }),
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
        createdAt: 'asc',
      },
      select: {
        id: true,
        type: true,
        result: true,
        createdAt: true,
      },
    });
  });

  it('returns empty progress for an owned CV with no history', async () => {
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
    });
    prisma.cvAnalysis.findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get(`/cvs/${cvId}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toEqual({
      cvId,
      scoreTimeline: [],
      atsTrend: [],
      scoringCategoryTrends: [],
      rewriteActivityTrend: [],
      improvementDeltas: {
        score: null,
        atsReadiness: null,
        keywordOptimization: null,
        impact: null,
      },
      summary: {
        earliestScore: null,
        latestScore: null,
        latestScoreVsEarliestScore: null,
        totalScoreAnalyses: 0,
        totalRewriteActions: 0,
        rewritesThisWeek: 0,
        insights: [],
      },
    });
  });

  it('returns CV_NOT_FOUND for a CV the user does not own', async () => {
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
      .get(`/cvs/${cvId}/progress`)
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
});
