import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';

type JobTargetRecord = {
  id: string;
  userId: string;
  title: string;
  companyName: string;
  jobDescriptionText: string;
  createdAt: Date;
  updatedAt: Date;
};

describe('job-targets routes', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
  const targetId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
  const createdAt = new Date('2026-05-23T09:00:00.000Z');
  const updatedAt = new Date('2026-05-23T10:00:00.000Z');
  let app: INestApplication;
  let tokenService: TokenService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
    jobTarget: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      jobTarget: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
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
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app.close();
  });

  it('lists non-deleted targets owned by the authenticated user', async () => {
    prisma.jobTarget.findMany.mockResolvedValue([
      targetRecord({ title: 'Senior Backend Engineer' }),
    ]);

    const response = await request(app.getHttpServer())
      .get('/job-targets')
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: targetId,
          userId,
          title: 'Senior Backend Engineer',
          companyName: 'Acme',
          jobDescriptionText: 'Build APIs with TypeScript and PostgreSQL.',
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      ],
      meta: {},
    });
    expect(prisma.jobTarget.findMany).toHaveBeenCalledWith({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: jobTargetSelectExpectation(),
    });
  });

  it('creates a target for the authenticated user', async () => {
    prisma.jobTarget.create.mockResolvedValue(targetRecord({}));

    const response = await request(app.getHttpServer())
      .post('/job-targets')
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .send({
        title: ' Senior Backend Engineer ',
        companyName: ' Acme ',
        jobDescriptionText: ' Build APIs with TypeScript and PostgreSQL. ',
      })
      .expect(201);

    expect(response.body.data).toEqual({
      id: targetId,
      userId,
      title: 'Senior Backend Engineer',
      companyName: 'Acme',
      jobDescriptionText: 'Build APIs with TypeScript and PostgreSQL.',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(prisma.jobTarget.create).toHaveBeenCalledWith({
      data: {
        userId,
        title: 'Senior Backend Engineer',
        companyName: 'Acme',
        jobDescriptionText: 'Build APIs with TypeScript and PostgreSQL.',
        deletedAt: null,
      },
      select: jobTargetSelectExpectation(),
    });
  });

  it('returns a target only when it belongs to the authenticated user', async () => {
    prisma.jobTarget.findFirst.mockResolvedValue(targetRecord({}));

    await request(app.getHttpServer())
      .get(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(200);

    expect(prisma.jobTarget.findFirst).toHaveBeenCalledWith({
      where: { id: targetId, userId, deletedAt: null },
      select: jobTargetSelectExpectation(),
    });
  });

  it('returns JOB_TARGET_NOT_FOUND for missing, deleted, or other-user targets', async () => {
    prisma.jobTarget.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(404);

    expect(response.body).toEqual({
      error: {
        code: 'JOB_TARGET_NOT_FOUND',
        message: 'Job target not found',
      },
      meta: {},
    });
  });

  it('updates a target after ownership validation', async () => {
    prisma.jobTarget.updateMany.mockResolvedValue({ count: 1 });
    prisma.jobTarget.findFirst.mockResolvedValue(
      targetRecord({ title: 'Staff Backend Engineer' }),
    );

    const response = await request(app.getHttpServer())
      .patch(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .send({
        title: ' Staff Backend Engineer ',
      })
      .expect(200);

    expect(response.body.data.title).toBe('Staff Backend Engineer');
    expect(prisma.jobTarget.updateMany).toHaveBeenCalledWith({
      where: { id: targetId, userId, deletedAt: null },
      data: {
        title: 'Staff Backend Engineer',
      },
    });
  });

  it('soft deletes a target after ownership validation', async () => {
    prisma.jobTarget.updateMany.mockResolvedValue({ count: 1 });

    const response = await request(app.getHttpServer())
      .delete(`/job-targets/${targetId}`)
      .set('Authorization', `Bearer ${tokenService.signAccessToken(userId)}`)
      .expect(200);

    expect(response.body).toEqual({
      data: {
        id: targetId,
        deletedAt: expect.any(String),
      },
      meta: {},
    });
    expect(prisma.jobTarget.updateMany).toHaveBeenCalledWith({
      where: { id: targetId, userId, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('validates required fields and UUID params', async () => {
    const accessToken = tokenService.signAccessToken(userId);

    await request(app.getHttpServer())
      .post('/job-targets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: '',
        companyName: 'Acme',
        jobDescriptionText: 'Build APIs.',
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('title is required');
      });

    await request(app.getHttpServer())
      .get('/job-targets/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('Validation failed (uuid is expected)');
      });
  });

  it('rejects unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/job-targets').expect(401);

    expect(prisma.jobTarget.findMany).not.toHaveBeenCalled();
  });

  function targetRecord(overrides: Partial<JobTargetRecord>): JobTargetRecord {
    return {
      id: targetId,
      userId,
      title: 'Senior Backend Engineer',
      companyName: 'Acme',
      jobDescriptionText: 'Build APIs with TypeScript and PostgreSQL.',
      createdAt,
      updatedAt,
      ...overrides,
    };
  }

  function jobTargetSelectExpectation() {
    return {
      id: true,
      userId: true,
      title: true,
      companyName: true,
      jobDescriptionText: true,
      createdAt: true,
      updatedAt: true,
    };
  }
});
