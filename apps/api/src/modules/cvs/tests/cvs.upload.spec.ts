import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { configureApp } from '../../../app.setup';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenService } from '../../auth/token.service';
import { FileStorageService } from '../services/file-storage.service';
import { PdfTextExtractor } from '../services/pdf-text-extractor.service';

describe('POST /cvs/upload', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalMaxFileSize = process.env.CV_MAX_FILE_SIZE_BYTES;
  const validPdfBuffer = Buffer.from('%PDF-1.7\n%test pdf content');
  const validDocxBuffer = Buffer.from(
    'PK\u0003\u0004[Content_Types].xml word/document.xml',
  );
  let app: INestApplication;
  let tokenService: TokenService;
  let fileStorageService: FileStorageService;
  let pdfTextExtractor: PdfTextExtractor;
  let uploadLocalSpy: jest.SpiedFunction<FileStorageService['uploadLocal']>;
  let extractFromFileSpy: jest.SpiedFunction<
    PdfTextExtractor['extractFromFile']
  >;
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
    pdfTextExtractor = app.get(PdfTextExtractor);

    // Mock the file storage service
    uploadLocalSpy = jest
      .spyOn(fileStorageService, 'uploadLocal')
      .mockResolvedValue({
        storageKey:
          'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
        storageUrl: null,
      });
    jest
      .spyOn(fileStorageService, 'getLocalPath')
      .mockReturnValue(
        '/app/uploads/cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
      );
    extractFromFileSpy = jest
      .spyOn(pdfTextExtractor, 'extractFromFile')
      .mockResolvedValue('Extracted CV text');
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
    const largeBuffer = Buffer.concat([
      Buffer.from('%PDF-1.7\n'),
      Buffer.alloc(5242880 + 1024),
    ]);

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', largeBuffer, 'large.pdf');

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File size exceeds maximum of 5 MB',
      },
      meta: {},
    });
    expect(uploadLocalSpy).not.toHaveBeenCalled();
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it('returns 400 when PDF content is malformed', async () => {
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
      .attach('file', Buffer.from('not a pdf'), 'resume.pdf')
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File content does not match the declared file type',
      },
      meta: {},
    });
    expect(uploadLocalSpy).not.toHaveBeenCalled();
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it('returns 400 when MIME type is spoofed', async () => {
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
      .attach('file', Buffer.from('plain text payload'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'File content does not match the declared file type',
      },
      meta: {},
    });
    expect(uploadLocalSpy).not.toHaveBeenCalled();
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it('throttles repeated upload attempts', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);
    const createdAt = new Date('2026-05-22T10:30:00.000Z');

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt,
    });
    prisma.cv.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: '57db9a57-197d-40b5-8be5-5a5dfe398912',
        title: data.title,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageProvider: data.storageProvider,
        storageKey: data.storageKey,
        storageUrl: data.storageUrl,
        extractedText: data.extractedText,
        createdAt,
      }),
    );

    for (let attempt = 1; attempt <= 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/cvs/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', validPdfBuffer, 'resume.pdf')
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', validPdfBuffer, 'resume.pdf')
      .expect(429);

    expect(response.body).toEqual({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests',
      },
      meta: {},
    });
    expect(uploadLocalSpy).toHaveBeenCalledTimes(10);
    expect(prisma.cv.create).toHaveBeenCalledTimes(10);
  });

  it('creates CV record from PDF upload with extracted text', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    const accessToken = tokenService.signAccessToken(userId);

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt,
    });

    const cvId = '57db9a57-197d-40b5-8be5-5a5dfe398912';
    const pdfBuffer = validPdfBuffer;
    prisma.cv.create.mockResolvedValue({
      id: cvId,
      title: 'resume.pdf',
      originalName: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: pdfBuffer.length,
      storageProvider: 'local',
      storageKey:
        'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
      storageUrl: null,
      extractedText: 'Extracted CV text',
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
        storageKey:
          'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
        storageUrl: null,
        extractedText: 'Extracted CV text',
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });

    expect(extractFromFileSpy).toHaveBeenCalledWith(
      '/app/uploads/cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
    );
    expect(prisma.cv.create).toHaveBeenCalledWith({
      data: {
        userId,
        title: 'resume.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: pdfBuffer.length,
        storageProvider: 'local',
        storageKey:
          'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
        storageUrl: null,
        extractedText: 'Extracted CV text',
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
      storageKey:
        'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf',
      storageUrl: null,
      extractedText: null,
      createdAt,
    });

    const pdfBuffer = validPdfBuffer;
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

    const docxBuffer = validDocxBuffer;
    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', docxBuffer, 'resume.docx')
      .expect(201);

    expect(response.body.data.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(response.body.data.extractedText).toBeNull();
    expect(extractFromFileSpy).not.toHaveBeenCalled();
    expect(prisma.cv.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          extractedText: null,
        }),
      }),
    );
  });

  it('returns 422, cleans up the stored file, and does not create CV when PDF extraction fails', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);
    const storageKey =
      'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf';

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });
    extractFromFileSpy.mockRejectedValue(new Error('invalid pdf'));
    const deleteSpy = jest
      .spyOn(fileStorageService, 'deleteFile')
      .mockResolvedValue();

    const response = await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', validPdfBuffer, 'resume.pdf')
      .expect(422);

    expect(response.body).toEqual({
      error: {
        code: 'PDF_TEXT_EXTRACTION_FAILED',
        message: 'Could not extract text from PDF file',
      },
      meta: {},
    });
    expect(deleteSpy).toHaveBeenCalledWith(storageKey);
    expect(prisma.cv.create).not.toHaveBeenCalled();
  });

  it('cleans up the stored file when CV creation fails', async () => {
    const userId = '43a84c6a-4bcf-47c1-a1e1-215ba79c9404';
    const accessToken = tokenService.signAccessToken(userId);
    const storageKey =
      'cvs/user-id/123456-550e8400-e29b-41d4-a716-446655440000-resume.pdf';

    prisma.user.findFirst.mockResolvedValue({
      id: userId,
      email: 'user@example.com',
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });
    prisma.cv.create.mockRejectedValue(new Error('database unavailable'));

    const deleteSpy = jest
      .spyOn(fileStorageService, 'deleteFile')
      .mockResolvedValue();

    await request(app.getHttpServer())
      .post('/cvs/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', validPdfBuffer, 'resume.pdf')
      .expect(500);

    expect(deleteSpy).toHaveBeenCalledWith(storageKey);
  });
});
