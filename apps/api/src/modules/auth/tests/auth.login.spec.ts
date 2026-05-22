import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../prisma/prisma.service';

describe('POST /auth/login', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  let app: INestApplication;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
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
    process.env.JWT_SECRET = originalJwtSecret;
    await app.close();
  });

  it('returns a public user and signed access token for valid credentials', async () => {
    const createdAt = new Date('2026-05-22T10:30:00.000Z');

    prisma.user.findFirst.mockResolvedValue({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      passwordHash:
        'scrypt:0a623ebb807a8d781a9bd929ebef9832:5293e48897c008f63148312a1354bf1839379f67980f91683e631d07d0b7aaeed21e3d2fe6b040197e66084d26d0ca4cf87301f4d67b34561f9536032899b73d',
      name: 'Ada Lovelace',
      createdAt,
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: ' USER@example.com ',
        password: 'correct-horse-battery-staple',
      })
      .expect(201);

    expect(response.body).toEqual({
      data: {
        user: {
          id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
          email: 'user@example.com',
          name: 'Ada Lovelace',
          createdAt: createdAt.toISOString(),
        },
        accessToken: expect.any(String),
      },
    });
    expect(response.body.data.accessToken.split('.')).toHaveLength(3);
    expect(isTokenSignedWithSecret(response.body.data.accessToken)).toBe(true);
    expect(
      decodeTokenPayload(response.body.data.accessToken),
    ).not.toHaveProperty('email');
    expect(decodeTokenPayload(response.body.data.accessToken)).toEqual({
      sub: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      exp: expect.any(Number),
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: 'user@example.com',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        createdAt: true,
      },
    });
  });

  it('rejects an unknown email with invalid credentials', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'correct-horse-battery-staple',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
      meta: {},
    });
  });

  it('rejects a wrong password with invalid credentials', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      passwordHash:
        'scrypt:0a623ebb807a8d781a9bd929ebef9832:5293e48897c008f63148312a1354bf1839379f67980f91683e631d07d0b7aaeed21e3d2fe6b040197e66084d26d0ca4cf87301f4d67b34561f9536032899b73d',
      name: 'Ada Lovelace',
      createdAt: new Date('2026-05-22T10:30:00.000Z'),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body).toEqual({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
      meta: {},
    });
  });

  it('does not log in soft-deleted users', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'deleted@example.com',
        password: 'correct-horse-battery-staple',
      })
      .expect(401);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          email: 'deleted@example.com',
          deletedAt: null,
        },
      }),
    );
  });

  it('rejects invalid email addresses', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'not-an-email',
        password: 'correct-horse-battery-staple',
      })
      .expect(400);

    expect(response.body.message).toEqual(['email must be an email']);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects short passwords', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'short',
      })
      .expect(400);

    expect(response.body.message).toEqual([
      'password must be longer than or equal to 8 characters',
    ]);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects unknown fields', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
        refreshToken: true,
      })
      .expect(400);

    expect(response.body.message).toEqual([
      'property refreshToken should not exist',
    ]);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('logs in with a password hash created during register', async () => {
    const createdAt = new Date('2026-05-22T10:30:00.000Z');
    let storedUser:
      | {
          id: string;
          email: string;
          passwordHash: string;
          name: string | null;
          createdAt: Date;
        }
      | undefined;

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => {
      storedUser = {
        id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        createdAt,
      };

      return Promise.resolve({
        id: storedUser.id,
        email: storedUser.email,
        name: storedUser.name,
        createdAt: storedUser.createdAt,
      });
    });
    prisma.user.findFirst.mockImplementation(() => Promise.resolve(storedUser));

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
        name: 'Ada Lovelace',
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'correct-horse-battery-staple',
      })
      .expect(201);

    expect(response.body.data.user).toEqual({
      id: '43a84c6a-4bcf-47c1-a1e1-215ba79c9404',
      email: 'user@example.com',
      name: 'Ada Lovelace',
      createdAt: createdAt.toISOString(),
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  function isTokenSignedWithSecret(token: string): boolean {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = createHmac('sha256', 'test-jwt-secret')
      .update(`${header}.${payload}`)
      .digest('base64url');

    return signature === expectedSignature;
  }

  function decodeTokenPayload(token: string): Record<string, unknown> {
    const [, payload] = token.split('.');

    return JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;
  }
});
