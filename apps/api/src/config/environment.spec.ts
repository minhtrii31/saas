import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('environment validation', () => {
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
  });

  it('fails application startup when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;

    await expect(
      Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile(),
    ).rejects.toThrow('JWT_SECRET is required');
  });
});
