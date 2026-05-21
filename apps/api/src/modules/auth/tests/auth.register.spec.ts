import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

describe('POST /auth/register', () => {
  let app: INestApplication;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a user with a hashed password and returns the public user fields', async () => {
    const createdAt = new Date('2026-05-22T10:30:00.000Z');

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        createdAt,
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
        name: 'Ada Lovelace',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        email: 'user@example.com',
        name: 'Ada Lovelace',
        createdAt: createdAt.toISOString(),
      },
      meta: {},
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: expect.any(String),
        name: 'Ada Lovelace',
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
    const passwordHash = prisma.user.create.mock.calls[0][0].data.passwordHash;
    expect(passwordHash).not.toBe('correct-horse-battery-staple');
    expect(passwordHash.length).toBeGreaterThan(40);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('allows name to be omitted', async () => {
    const createdAt = new Date('2026-05-22T10:30:00.000Z');

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      name: null,
      createdAt,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
      })
      .expect(201);

    expect(response.body.data).toEqual({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      name: null,
      createdAt: createdAt.toISOString(),
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        passwordHash: expect.any(String),
        name: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  });

  it('rejects duplicate email registrations', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'existing-user-id',
      email: 'user@example.com',
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
      })
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email is already registered',
      },
      meta: {},
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects invalid email addresses', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'not-an-email',
        password: 'correct-horse-battery-staple',
      })
      .expect(400);

    expect(response.body.message).toEqual(['email must be an email']);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects short passwords', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'short',
      })
      .expect(400);

    expect(response.body.message).toEqual([
      'password must be longer than or equal to 8 characters',
    ]);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects invalid password types', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 12345678,
      })
      .expect(400);

    expect(response.body.message).toContain('password must be a string');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
        role: 'admin',
      })
      .expect(400);

    expect(response.body.message).toEqual(['property role should not exist']);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('maps Prisma unique constraint errors on create to duplicate email responses', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue({
      code: 'P2002',
      meta: {
        target: ['email'],
      },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
      })
      .expect(409);

    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email is already registered',
      },
      meta: {},
    });
  });
});
