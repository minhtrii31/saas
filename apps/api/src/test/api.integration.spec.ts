import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createIntegrationTestApp } from './integration-test-app';
import {
  resetTestDatabase,
  resetTestThrottlerStorage,
} from './prisma-test-utils';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../modules/usage/usage.service';

describe('API PostgreSQL integration', () => {
  const password = 'correct-horse-battery-staple';
  const expectedScoringCategories = {
    atsReadiness: expect.any(Number),
    readability: expect.any(Number),
    impact: expect.any(Number),
    keywordOptimization: expect.any(Number),
    structure: expect.any(Number),
    experienceQuality: expect.any(Number),
  };
  const expectedActionableInsights = {
    missingQuantifiedAchievements: expect.arrayContaining([expect.any(String)]),
    weakActionVerbs: expect.arrayContaining([expect.any(String)]),
    missingSections: expect.arrayContaining([expect.any(String)]),
    overlyGenericWording: expect.arrayContaining([expect.any(String)]),
    formattingConcerns: expect.arrayContaining([expect.any(String)]),
    keywordGaps: expect.arrayContaining([expect.any(String)]),
  };
  let app: INestApplication;
  let prisma: PrismaService;
  let usageService: UsageService;

  beforeAll(async () => {
    app = await createIntegrationTestApp();
    prisma = app.get(PrismaService);
    usageService = app.get(UsageService);
  });

  beforeEach(async () => {
    resetTestThrottlerStorage(app);
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
    resetTestThrottlerStorage(app);
    await resetTestDatabase(prisma);
    await app.close();
  });

  it('registers a user in PostgreSQL', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'register.integration@example.com',
        password,
        name: 'Ada Lovelace',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        email: 'register.integration@example.com',
        name: 'Ada Lovelace',
        createdAt: expect.any(String),
      },
      meta: {},
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: {
        email: 'register.integration@example.com',
      },
    });
    expect(user.passwordHash).not.toBe(password);
    expect(user.name).toBe('Ada Lovelace');
  });

  it('logs in a PostgreSQL-backed user', async () => {
    await registerUser('login.integration@example.com');

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login.integration@example.com',
        password,
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        user: {
          id: expect.any(String),
          email: 'login.integration@example.com',
          name: 'Integration User',
          createdAt: expect.any(String),
        },
        accessToken: expect.any(String),
      },
      meta: {},
    });
  });

  it('uploads a CV into PostgreSQL using the real Nest app', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'upload.integration@example.com',
    );
    const docxBuffer = Buffer.from(
      'PK\u0003\u0004[Content_Types].xml word/document.xml',
    );

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Integration CV')
      .attach('file', docxBuffer, {
        filename: 'integration-cv.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        title: 'Integration CV',
        originalName: 'integration-cv.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: docxBuffer.length,
        storageProvider: 'local',
        storageKey: expect.stringMatching(/^cvs\/.+\/.+integration-cv\.docx$/),
        storageUrl: null,
        extractedText: null,
        createdAt: expect.any(String),
      },
      meta: {},
    });

    const cv = await prisma.cv.findFirstOrThrow({
      where: {
        id: response.body.data.id as string,
        userId,
      },
    });
    expect(cv.storageProvider).toBe('local');
    expect(cv.originalName).toBe('integration-cv.docx');
  });

  it('analyzes an owned CV through PostgreSQL and the mock AI provider', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'analyze.integration@example.com',
    );
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Backend CV',
        originalName: 'backend-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageProvider: 'local',
        storageKey: `cvs/${userId}/backend-cv.pdf`,
        storageUrl: null,
        extractedText:
          'Backend engineer with TypeScript, NestJS, PostgreSQL, Prisma, and API testing experience.',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cv.id}/analyze`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        cvId: cv.id,
        type: 'CV_ANALYSIS',
        aiProvider: 'mock',
        aiModel: 'mock-cv-analyzer-v1',
        result: {
          score: expect.any(Number),
          scoringCategories: expectedScoringCategories,
          strengths: expect.arrayContaining([expect.any(String)]),
          weaknesses: expect.arrayContaining([expect.any(String)]),
          actionableInsights: expectedActionableInsights,
          suggestions: expect.arrayContaining([expect.any(String)]),
        },
        createdAt: expect.any(String),
      },
      meta: {},
    });
    expect(response.body.data.result).toEqual(
      expect.objectContaining({
        score: expect.any(Number),
        scoringCategories: expectedScoringCategories,
        strengths: expect.arrayContaining([expect.any(String)]),
        weaknesses: expect.arrayContaining([expect.any(String)]),
        actionableInsights: expectedActionableInsights,
        suggestions: expect.arrayContaining([expect.any(String)]),
      }),
    );

    await expect(
      prisma.cvAnalysis.findFirstOrThrow({
        where: {
          id: response.body.data.id as string,
          cvId: cv.id,
          type: 'CV_ANALYSIS',
        },
      }),
    ).resolves.toMatchObject({
      aiProvider: 'mock',
      aiModel: 'mock-cv-analyzer-v1',
    });
  });

  it('deducts credits and persists usage when CV analysis succeeds', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'usage-success.integration@example.com',
    );
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Backend CV',
        originalName: 'backend-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageProvider: 'local',
        storageKey: `cvs/${userId}/backend-cv.pdf`,
        storageUrl: null,
        extractedText:
          'Backend engineer with TypeScript, NestJS, PostgreSQL, Prisma, and API testing experience.',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cv.id}/analyze`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await expect(
      prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
      }),
    ).resolves.toMatchObject({
      creditBalance: 9,
    });

    await expect(
      prisma.usageRecord.findFirstOrThrow({
        where: {
          userId,
          action: 'CV_ANALYSIS',
          cvAnalysisId: response.body.data.id as string,
        },
      }),
    ).resolves.toMatchObject({
      creditsUsed: 1,
    });
  });

  it('returns INSUFFICIENT_CREDITS before AI history is created', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'usage-insufficient.integration@example.com',
    );
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        creditBalance: 0,
      },
    });
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Backend CV',
        originalName: 'backend-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageProvider: 'local',
        storageKey: `cvs/${userId}/backend-cv.pdf`,
        storageUrl: null,
        extractedText:
          'Backend engineer with TypeScript, NestJS, PostgreSQL, Prisma, and API testing experience.',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cv.id}/analyze`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(402);

    expect(response.body).toEqual({
      error: {
        code: 'INSUFFICIENT_CREDITS',
        message: 'Insufficient credits',
      },
      meta: {},
    });
    await expect(
      prisma.cvAnalysis.count({
        where: {
          cvId: cv.id,
        },
      }),
    ).resolves.toBe(0);
    await expect(
      prisma.usageRecord.count({
        where: {
          userId,
        },
      }),
    ).resolves.toBe(0);
  });

  it('rolls back credit consumption when the surrounding transaction fails', async () => {
    const userId = await registerUser('usage-rollback.integration@example.com');

    await expect(
      prisma.$transaction(async (tx) => {
        await usageService.consumeCredits(userId, 'CV_ANALYSIS', { tx });
        throw new Error('simulate history persistence failure');
      }),
    ).rejects.toThrow('simulate history persistence failure');

    await expect(
      prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
      }),
    ).resolves.toMatchObject({
      creditBalance: 10,
    });
    await expect(
      prisma.usageRecord.count({
        where: {
          userId,
        },
      }),
    ).resolves.toBe(0);
  });

  it('rewrites resume text through PostgreSQL and the mock AI provider', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'rewrite.integration@example.com',
    );
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Backend CV',
        originalName: 'backend-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageProvider: 'local',
        storageKey: `cvs/${userId}/backend-cv.pdf`,
        storageUrl: null,
        extractedText:
          'Backend engineer with TypeScript, NestJS, PostgreSQL, and API testing experience.',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cv.id}/rewrite`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        originalText: 'Responsible for APIs and helped with database work.',
        rewriteGoal: 'stronger-impact',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        cvId: cv.id,
        type: 'RESUME_REWRITE',
        aiProvider: 'mock',
        aiModel: 'mock-resume-rewrite-v1',
        result: {
          originalText: 'Responsible for APIs and helped with database work.',
          rewrittenText: expect.any(String),
          explanation: expect.any(String),
          rewriteGoal: 'stronger-impact',
        },
        createdAt: expect.any(String),
      },
      meta: {},
    });
    expect(response.body.data.result.rewrittenText).toContain('Owned');

    await expect(
      prisma.cvAnalysis.findFirstOrThrow({
        where: {
          id: response.body.data.id as string,
          cvId: cv.id,
          type: 'RESUME_REWRITE',
        },
      }),
    ).resolves.toMatchObject({
      aiProvider: 'mock',
      aiModel: 'mock-resume-rewrite-v1',
    });
  });

  it('persists rewrite refinement through PostgreSQL and the mock AI provider', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'rewrite-refinement.integration@example.com',
    );
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Backend CV',
        originalName: 'backend-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageProvider: 'local',
        storageKey: `cvs/${userId}/backend-cv.pdf`,
        storageUrl: null,
        extractedText:
          'Backend engineer with TypeScript, NestJS, PostgreSQL, and API testing experience.',
      },
    });

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cv.id}/rewrite/refine`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        original: 'Responsible for APIs and helped with database work.',
        currentRewrite: 'Delivered API improvements.',
        instruction: 'more-technical',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        cvId: cv.id,
        type: 'REWRITE_REFINEMENT',
        aiProvider: 'mock',
        aiModel: 'mock-resume-rewrite-v1',
        result: {
          improved: expect.any(String),
          reason: expect.any(String),
        },
        createdAt: expect.any(String),
      },
      meta: {},
    });
    expect(response.body.data.result.improved).toContain('TypeScript');

    await expect(
      prisma.cvAnalysis.findFirstOrThrow({
        where: {
          id: response.body.data.id as string,
          cvId: cv.id,
          type: 'REWRITE_REFINEMENT',
        },
      }),
    ).resolves.toMatchObject({
      aiProvider: 'mock',
      aiModel: 'mock-resume-rewrite-v1',
    });
  });

  it('persists job targets and enforces ownership through PostgreSQL', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'job-target.integration@example.com',
    );
    const { accessToken: otherAccessToken } = await registerAndLogin(
      'job-target-other.integration@example.com',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/job-targets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: ' Senior Backend Engineer ',
        companyName: ' Acme ',
        jobDescriptionText:
          ' Build APIs with TypeScript, NestJS, and PostgreSQL. ',
      })
      .expect(201);

    expect(createResponse.body).toEqual({
      data: {
        id: expect.any(String),
        userId,
        title: 'Senior Backend Engineer',
        companyName: 'Acme',
        jobDescriptionText:
          'Build APIs with TypeScript, NestJS, and PostgreSQL.',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
      meta: {},
    });

    const targetId = createResponse.body.data.id as string;

    await request(app.getHttpServer())
      .get(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(404);

    const patchResponse = await request(app.getHttpServer())
      .patch(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        companyName: 'Acme AI',
      })
      .expect(200);

    expect(patchResponse.body.data.companyName).toBe('Acme AI');

    const listResponse = await request(app.getHttpServer())
      .get('/job-targets')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toMatchObject({
      id: targetId,
      userId,
      title: 'Senior Backend Engineer',
      companyName: 'Acme AI',
    });

    await request(app.getHttpServer())
      .delete(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    await expect(
      prisma.jobTarget.findFirstOrThrow({
        where: {
          id: targetId,
        },
      }),
    ).resolves.toMatchObject({
      userId,
      title: 'Senior Backend Engineer',
      deletedAt: expect.any(Date),
    });
  });

  it('returns CV progress trends through PostgreSQL', async () => {
    const { accessToken, userId } = await registerAndLogin(
      'progress.integration@example.com',
    );
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Progress CV',
        originalName: 'progress-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        storageProvider: 'local',
        storageKey: `cvs/${userId}/progress-cv.pdf`,
        storageUrl: null,
        extractedText:
          'Backend engineer with TypeScript and measurable impact.',
      },
    });

    await prisma.cvAnalysis.createMany({
      data: [
        {
          cvId: cv.id,
          type: 'CV_ANALYSIS',
          result: {
            score: 64,
            scoringCategories: {
              atsReadiness: 60,
              readability: 66,
              impact: 55,
              keywordOptimization: 58,
              structure: 68,
              experienceQuality: 62,
            },
          },
          createdAt: new Date('2026-05-18T10:00:00.000Z'),
        },
        {
          cvId: cv.id,
          type: 'RESUME_REWRITE',
          result: {
            originalText: 'Worked on APIs.',
            rewrittenText: 'Delivered APIs that reduced review time by 20%.',
            explanation: 'Adds impact.',
            rewriteGoal: 'stronger-impact',
          },
          createdAt: new Date('2026-05-20T10:00:00.000Z'),
        },
        {
          cvId: cv.id,
          type: 'CV_ANALYSIS',
          result: {
            score: 78,
            scoringCategories: {
              atsReadiness: 72,
              readability: 76,
              impact: 68,
              keywordOptimization: 74,
              structure: 80,
              experienceQuality: 76,
            },
          },
          createdAt: new Date('2026-05-22T10:00:00.000Z'),
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get(`/cvs/${cv.id}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      cvId: cv.id,
      scoreTimeline: [
        {
          score: 64,
          createdAt: '2026-05-18T10:00:00.000Z',
        },
        {
          score: 78,
          createdAt: '2026-05-22T10:00:00.000Z',
        },
      ],
      atsTrend: [
        {
          score: 60,
          createdAt: '2026-05-18T10:00:00.000Z',
        },
        {
          score: 72,
          createdAt: '2026-05-22T10:00:00.000Z',
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
        score: 14,
        atsReadiness: 12,
        keywordOptimization: 16,
        impact: 13,
      },
      summary: {
        earliestScore: 64,
        latestScore: 78,
        latestScoreVsEarliestScore: 14,
        totalScoreAnalyses: 2,
        totalRewriteActions: 1,
        rewritesThisWeek: expect.any(Number),
        insights: expect.arrayContaining([
          'ATS readiness improved +12',
          'Keyword optimization improved +16',
        ]),
      },
    });
  });

  async function registerUser(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Integration User',
      })
      .expect(201);

    return response.body.data.id as string;
  }

  async function registerAndLogin(
    email: string,
  ): Promise<{ accessToken: string; userId: string }> {
    const userId = await registerUser(email);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    return {
      accessToken: response.body.data.accessToken as string,
      userId,
    };
  }
});
