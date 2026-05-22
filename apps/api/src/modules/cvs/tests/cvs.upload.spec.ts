import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';
import { FileStorageService } from '../services/file-storage.service';

describe('POST /cvs/upload', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalMaxFileSize = process.env.CV_MAX_FILE_SIZE_BYTES;
  let app: INestApplication;
  let tokenService: TokenService;
  let fileStorageService: FileStorageService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
    };
    cv: {
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.CV_MAX_FILE_SIZE_BYTES = '5242880'; // 5MB

    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      cv: {
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
    fileStorageService = app.get(FileStorageService);

    // Mock the file storage service
    jest.spyOn(fileStorageService, 'uploadLocal').mockResolvedValue({
      storageKey: 'cvs/user-id/123456-abc12-resume.pdf',
      storageUrl: null,
    });
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.CV_MAX_FILE_SIZE_BYTES = originalMaxFileSize;
    jest.restoreAllMocks();
    await app.close();
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .attach('file', Buffer.from('test'), 'resume.pdf')
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
      meta: {},
    });
  });

  it('returns 400 when file is missing', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File is required',
      },
      meta: {},
    });
  });

  it('returns 400 when MIME type is not supported', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('test'), 'document.txt')
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Only PDF, DOC, and DOCX files are supported',
      },
      meta: {},
    });
  });

  it('returns 400 when file exceeds max size', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt: new Date(),
    });

    // Create a buffer slightly larger than 5MB (5242880 bytes)
    // 5MB + 1024 bytes = 5243904 bytes
    const largeBuffer = Buffer.alloc(5242880 + 1024);

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', largeBuffer, 'large.pdf');

    // Accept either 400 (our validation) or 413 (Express payload limit)
    expect([400, 413]).toContain(response.status);

    if (response.status === 400) {
      expect(response.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'File size exceeds maximum of 5 MB',
        },
        meta: {},
      });
    }
  });

  it('creates CV record from PDF upload', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt,
    });

    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const pdfBuffer = Buffer.from('PDF content');
    prisma.cv.create.mockResolvedValue({
      id: cvId,
      title: 'resume.pdf',
      originalName: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      storageProvider: 'local',
      storageKey: 'cvs/user-id/123456-abc12-resume.pdf',
      storageUrl: null,
      extractedText: null,
      createdAt,
    });

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', pdfBuffer, 'resume.pdf')
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: cvId,
        title: 'resume.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: pdfBuffer.length,
        storageProvider: 'local',
        storageKey: 'cvs/user-id/123456-abc12-resume.pdf',
        storageUrl: null,
        extractedText: null,
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });

    expect(prisma.cv.create).toHaveBeenCalledWith({
      data: {
        userId,
        title: 'resume.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: pdfBuffer.length,
        storageProvider: 'local',
        storageKey: 'cvs/user-id/123456-abc12-resume.pdf',
        storageUrl: null,
        extractedText: null,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        storageProvider: true,
        storageKey: true,
        storageUrl: true,
        extractedText: true,
        createdAt: true,
      },
    });
  });

  it('creates CV record with title from optional parameter', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt,
    });

    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    prisma.cv.create.mockResolvedValue({
      id: cvId,
      title: 'Backend Engineer CV',
      originalName: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 123456,
      storageProvider: 'local',
      storageKey: 'cvs/user-id/123456-abc12-resume.pdf',
      storageUrl: null,
      extractedText: null,
      createdAt,
    });

    const pdfBuffer = Buffer.from('PDF content');
    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Backend Engineer CV')
      .attach('file', pdfBuffer, 'resume.pdf')
      .expect(201);

    expect(response.body.data.title).toBe('Backend Engineer CV');

    expect(prisma.cv.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Backend Engineer CV',
        }),
      }),
    );
  });

  it('creates CV record from DOCX upload', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt,
    });

    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    prisma.cv.create.mockResolvedValue({
      id: cvId,
      title: 'resume.docx',
      originalName: 'resume.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 54321,
      storageProvider: 'local',
      storageKey: 'cvs/user-id/123456-abc12-resume.docx',
      storageUrl: null,
      extractedText: null,
      createdAt,
    });

    const docxBuffer = Buffer.from('DOCX content');
    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', docxBuffer, 'resume.docx')
      .expect(201);

    expect(response.body.data.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });
});
