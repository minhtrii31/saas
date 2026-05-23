import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

type ApplicationRecord = {
  id: string;
  userId: string;
  cvId: string;
  jobTargetId: string | null;
  companyName: string;
  roleTitle: string;
  status: 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';
  appliedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

describe('applications routes', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
  const applicationId = '87df9cdb-9386-4676-8cbe-07f85d110dd4';
  const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
  const jobTargetId = 'a9df94a5-b938-4932-ac3c-7c99d6380b12';
  const analysisId = '6a7f1326-5450-4a2d-b0d8-7fb79e3f18d2';
  const createdAt = new Date('2026-05-23T09:00:00.000Z');
  const updatedAt = new Date('2026-05-23T10:00:00.000Z');
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    $transaction: jest.Mock;
    user: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
    application: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
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
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.FREE_STARTER_CREDITS = '10';
    prisma = {
      $transaction: jest.fn((callback: (tx: unknown) => unknown) =>
        Promise.resolve(callback(prisma)),
      ),
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
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
    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt,
    });
    prisma.user.findUnique.mockResolvedValue({ creditBalance: 10 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.usageRecord.create.mockResolvedValue({});
    prisma.cv.findFirst.mockResolvedValue({
      id: cvId,
      extractedText:
        'Ada Lovelace. Backend Engineer with TypeScript, NestJS, and PostgreSQL experience.',
    });
    prisma.jobTarget.findFirst.mockResolvedValue({ id: jobTargetId });
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    delete process.env.FREE_STARTER_CREDITS;
    await app.close();
  });

  it('lists applications owned by the authenticated user', async () => {
    prisma.application.findMany.mockResolvedValue([applicationRecord({})]);

    const response = await request(app.getHttpServer())
      .get('/applications')
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(200);

    expect(response.body.data).toEqual([
      expectedApplication({ status: 'APPLIED' }),
    ]);
    expect(prisma.application.findMany).toHaveBeenCalledWith({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: applicationSelectExpectation(),
    });
  });

  it('creates an application after validating CV and job target ownership', async () => {
    prisma.application.create.mockResolvedValue(applicationRecord({}));

    const response = await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .send({
        cvId,
        jobTargetId,
        companyName: ' Acme ',
        roleTitle: ' Backend Engineer ',
        status: 'APPLIED',
        appliedAt: '2026-05-23T08:00:00.000Z',
        notes: ' Follow up next week. ',
      })
      .expect(201);

    expect(response.body.data).toEqual(expectedApplication({}));
    expect(prisma.cv.findFirst).toHaveBeenCalledWith({
      where: { id: cvId, userId, deletedAt: null },
      select: { id: true },
    });
    expect(prisma.jobTarget.findFirst).toHaveBeenCalledWith({
      where: { id: jobTargetId, userId, deletedAt: null },
      select: { id: true },
    });
    expect(prisma.application.create).toHaveBeenCalledWith({
      data: {
        userId,
        cvId,
        jobTargetId,
        companyName: 'Acme',
        roleTitle: 'Backend Engineer',
        status: 'APPLIED',
        appliedAt: new Date('2026-05-23T08:00:00.000Z'),
        notes: 'Follow up next week.',
        deletedAt: null,
      },
      select: applicationSelectExpectation(),
    });
  });

  it('updates an application after ownership validation', async () => {
    prisma.application.findFirst
      .mockResolvedValueOnce({ id: applicationId })
      .mockResolvedValueOnce(applicationRecord({ status: 'INTERVIEWING' }));
    prisma.application.updateMany.mockResolvedValue({ count: 1 });

    const response = await request(app.getHttpServer())
      .patch(`/applications/${applicationId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .send({
        status: 'INTERVIEWING',
        notes: 'Screen completed.',
      })
      .expect(200);

    expect(response.body.data.status).toBe('INTERVIEWING');
    expect(prisma.application.updateMany).toHaveBeenCalledWith({
      where: { id: applicationId, userId, deletedAt: null },
      data: {
        cvId: undefined,
        jobTargetId: undefined,
        companyName: undefined,
        roleTitle: undefined,
        status: 'INTERVIEWING',
        appliedAt: undefined,
        notes: 'Screen completed.',
      },
    });
  });

  it('soft deletes only owned applications', async () => {
    prisma.application.updateMany.mockResolvedValue({ count: 1 });

    const response = await request(app.getHttpServer())
      .delete(`/applications/${applicationId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(200);

    expect(response.body).toEqual({
      data: {
        id: applicationId,
        deletedAt: expect.any(String),
      },
      meta: {},
    });
    expect(prisma.application.updateMany).toHaveBeenCalledWith({
      where: { id: applicationId, userId, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('returns APPLICATION_NOT_FOUND for other-user applications', async () => {
    prisma.application.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .patch(`/applications/${applicationId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .send({ status: 'OFFER' })
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      },
      meta: {},
    });
    expect(prisma.application.updateMany).not.toHaveBeenCalled();
  });

  it('validates body fields and UUID params', async () => {
    const accessToken = tokenService.signAccessToken(userId);

    await request(app.getHttpServer())
      .post('/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cvId,
        companyName: '',
        roleTitle: 'Backend Engineer',
        status: 'UNKNOWN',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('companyName is required');
      });

    await request(app.getHttpServer())
      .delete('/applications/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('Validation failed (uuid is expected)');
      });
  });

  it('generates a follow-up draft and persists it in history with usage', async () => {
    prisma.application.findFirst.mockResolvedValue(applicationRecord({}));
    prisma.cvAnalysis.create.mockResolvedValue({ id: analysisId });

    const response = await request(app.getHttpServer())
      .post(`/applications/${applicationId}/follow-up`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(201);

    expect(response.body.data).toEqual({
      applicationId,
      analysisId,
      draft: expect.stringContaining('Subject: Follow-up on Backend Engineer'),
      tone: 'professional',
      status: 'APPLIED',
    });
    expect(prisma.cvAnalysis.create).toHaveBeenCalledWith({
      data: {
        cvId,
        type: 'APPLICATION_FOLLOW_UP',
        aiProvider: 'mock',
        aiModel: 'mock-application-follow-up-v1',
        result: {
          applicationId,
          draft: expect.stringContaining('Hello Acme team'),
          tone: 'professional',
        },
      },
      select: { id: true },
    });
    expect(prisma.usageRecord.create).toHaveBeenCalledWith({
      data: {
        userId,
        action: 'APPLICATION_FOLLOW_UP',
        creditsUsed: 1,
        cvAnalysisId: analysisId,
      },
    });
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/applications').expect(401);

    expect(prisma.application.findMany).not.toHaveBeenCalled();
  });

  function applicationRecord(
    overrides: Partial<ApplicationRecord>,
  ): ApplicationRecord {
    return {
      id: applicationId,
      userId,
      cvId,
      jobTargetId,
      companyName: 'Acme',
      roleTitle: 'Backend Engineer',
      status: 'APPLIED',
      appliedAt: new Date('2026-05-23T08:00:00.000Z'),
      notes: 'Follow up next week.',
      createdAt,
      updatedAt,
      ...overrides,
    };
  }

  function expectedApplication(overrides: Partial<ApplicationRecord>) {
    const record = applicationRecord(overrides);

    return {
      ...record,
      appliedAt: record.appliedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  function applicationSelectExpectation() {
    return {
      id: true,
      userId: true,
      cvId: true,
      jobTargetId: true,
      companyName: true,
      roleTitle: true,
      status: true,
      appliedAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    };
  }
});
