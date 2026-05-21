import { INestApplication } from '@nestjs/common';
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

    const response = await request(app.getHttpAdapter().getInstance())
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

    const response = await request(app.getHttpAdapter().getInstance())
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

    const response = await request(app.getHttpAdapter().getInstance())
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
});
