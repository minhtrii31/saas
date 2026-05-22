import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createIntegrationTestApp } from './integration-test-app';
import { resetTestDatabase } from './prisma-test-utils';
import { PrismaService } from '../prisma/prisma.service';

describe('API PostgreSQL integration', () => {
  const password = 'correct-horse-battery-staple';
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createIntegrationTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  afterAll(async () => {
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
          strengths: expect.arrayContaining([expect.any(String)]),
          weaknesses: expect.arrayContaining([expect.any(String)]),
          suggestions: expect.arrayContaining([expect.any(String)]),
        },
        createdAt: expect.any(String),
      },
      meta: {},
    });

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
