import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { EnvironmentService } from './environment.service';
import { PrismaService } from '../prisma/prisma.service';

describe('environment validation', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAiProvider = process.env.AI_PROVIDER;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.AI_PROVIDER = originalAiProvider;
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    process.env.OPENAI_MODEL = originalOpenAiModel;
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

  it('defaults AI_PROVIDER to mock when unset', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(module.get(EnvironmentService, { strict: false }).aiProvider).toBe(
      'mock',
    );
  });

  it('requires OPENAI_API_KEY when AI_PROVIDER is openai', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;

    await expect(
      Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile(),
    ).rejects.toThrow('OPENAI_API_KEY is required when AI_PROVIDER=openai');
  });

  it('uses a safe default OpenAI model when OPENAI_MODEL is missing', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.OPENAI_MODEL;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const environmentService = module.get(EnvironmentService, {
      strict: false,
    });

    expect(environmentService.openAiModel).toBe('gpt-4.1-mini');
  });
});
