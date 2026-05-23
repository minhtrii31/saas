import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

describe('POST /cvs/:id/interview-prep', () => {
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
    jobTarget: {
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
      jobTarget: {
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

  it('creates mock interview prep for an owned CV and saved job target', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const jobTargetId = 'a89bf629-97d6-41b1-ad40-20e59563d47d';
    const analysisId = '2f8d69b3-9274-496d-a9a4-2df643f0fe9a';
    const createdAt = new Date('2026-05-23T10:30:00.000Z');
    const jobDescriptionText =
      'Backend role requiring TypeScript, NestJS, PostgreSQL, Redis, and system design.';
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
        'Ada is a backend engineer with TypeScript, NestJS, PostgreSQL, and API testing experience.',
    });
    prisma.jobTarget.findFirst.mockResolvedValue({
      id: jobTargetId,
      jobDescriptionText,
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
      .post(`/cvs/${cvId}/interview-prep`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        jobTargetId,
        interviewFocus: 'mixed',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: analysisId,
        cvId,
        type: 'INTERVIEW_PREP',
        jobDescriptionText,
        aiProvider: 'mock',
        aiModel: 'mock-interview-prep-v1',
        result: {
          focus: 'mixed',
          questions: expect.arrayContaining([
            {
              question: expect.any(String),
              whyItMatters: expect.any(String),
              suggestedAnswerDirection: expect.any(String),
              starGuidance: expect.any(Object),
            },
          ]),
          weakPointFocusAreas: expect.arrayContaining([expect.any(String)]),
        },
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });
    expect(prisma.jobTarget.findFirst).toHaveBeenCalledWith({
      where: {
        id: jobTargetId,
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        jobDescriptionText: true,
      },
    });
    expect(prisma.cvAnalysis.create).toHaveBeenCalledWith({
      data: {
        cvId,
        type: 'INTERVIEW_PREP',
        jobDescriptionText,
        aiProvider: 'mock',
        aiModel: 'mock-interview-prep-v1',
        result: {
          focus: 'mixed',
          questions: expect.arrayContaining([expect.any(Object)]),
          weakPointFocusAreas: expect.arrayContaining([expect.any(String)]),
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
    expect(prisma.usageRecord.create).toHaveBeenCalledWith({
      data: {
        userId,
        action: 'INTERVIEW_PREP',
        creditsUsed: 1,
        cvAnalysisId: analysisId,
      },
    });
  });

  it('uses manual job description text when no saved target is selected', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const analysisId = '2f8d69b3-9274-496d-a9a4-2df643f0fe9a';
    const createdAt = new Date('2026-05-23T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt,
    });
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
      extractedText: 'Backend engineer with TypeScript and NestJS.',
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

    await request(app.getHttpServer())
      .post(`/cvs/${cvId}/interview-prep`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        jobDescriptionText: ' Technical backend interview for NestJS APIs. ',
        interviewFocus: 'technical',
      })
      .expect(201);

    expect(prisma.jobTarget.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobDescriptionText: 'Technical backend interview for NestJS APIs.',
          result: expect.objectContaining({
            focus: 'technical',
          }),
        }),
      }),
    );
  });

  it('returns CV_NOT_FOUND for another user CV', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-23T10:30:00.000Z'),
    });
    prisma.cv.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/interview-prep`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ interviewFocus: 'behavioral' })
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

  it('returns JOB_TARGET_NOT_FOUND for another user saved target', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const jobTargetId = 'a89bf629-97d6-41b1-ad40-20e59563d47d';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: null,
      createdAt: new Date('2026-05-23T10:30:00.000Z'),
    });
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
      extractedText: 'Backend engineer with TypeScript and NestJS.',
    });
    prisma.jobTarget.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post(`/cvs/${cvId}/interview-prep`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        jobTargetId,
        interviewFocus: 'mixed',
      })
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'JOB_TARGET_NOT_FOUND',
        message: 'Job target not found',
      },
      meta: {},
    });
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('requires a valid interviewFocus', async () => {
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
      .post(`/cvs/${cvId}/interview-prep`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ interviewFocus: 'case-study' })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'interviewFocus must be one of the following values: behavioral, technical, mixed',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
    expect(prisma.cvAnalysis.create).not.toHaveBeenCalled();
  });

  it('rejects invalid jobTargetId', async () => {
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
      .post(`/cvs/${cvId}/interview-prep`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ interviewFocus: 'mixed', jobTargetId: 'not-a-uuid' })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'jobTargetId must be a UUID',
      },
      meta: {},
    });
    expect(prisma.cv.findFirst).not.toHaveBeenCalled();
  });
});
