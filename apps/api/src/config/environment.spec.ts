import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { EnvironmentService } from './environment.service';
import { PrismaService } from '../prisma/prisma.service';

describe('environment validation', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAiProvider = process.env.AI_PROVIDER;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;
  const originalOpenAiBaseUrl = process.env.OPENAI_BASE_URL;
  const originalOpenRouterSiteUrl = process.env.OPENROUTER_SITE_URL;
  const originalOpenRouterSiteName = process.env.OPENROUTER_SITE_NAME;
  const originalAiMaxCvChars = process.env.AI_MAX_CV_CHARS;
  const originalAiMaxJdChars = process.env.AI_MAX_JD_CHARS;
  const originalFreeStarterCredits = process.env.FREE_STARTER_CREDITS;
  const originalCvAnalysisCost = process.env.USAGE_COST_CV_ANALYSIS;

  afterEach(() => {
    restoreEnv('JWT_SECRET', originalJwtSecret);
    restoreEnv('AI_PROVIDER', originalAiProvider);
    restoreEnv('OPENAI_API_KEY', originalOpenAiApiKey);
    restoreEnv('OPENAI_MODEL', originalOpenAiModel);
    restoreEnv('OPENAI_BASE_URL', originalOpenAiBaseUrl);
    restoreEnv('OPENROUTER_SITE_URL', originalOpenRouterSiteUrl);
    restoreEnv('OPENROUTER_SITE_NAME', originalOpenRouterSiteName);
    restoreEnv('AI_MAX_CV_CHARS', originalAiMaxCvChars);
    restoreEnv('AI_MAX_JD_CHARS', originalAiMaxJdChars);
    restoreEnv('FREE_STARTER_CREDITS', originalFreeStarterCredits);
    restoreEnv('USAGE_COST_CV_ANALYSIS', originalCvAnalysisCost);
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

  it('reads optional OpenAI-compatible endpoint configuration from env', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1';
    process.env.OPENROUTER_SITE_URL = 'https://nyx.example';
    process.env.OPENROUTER_SITE_NAME = 'Nyx CV Workspace';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const environmentService = module.get(EnvironmentService, {
      strict: false,
    });

    expect(environmentService.openAiBaseUrl).toBe(
      'https://openrouter.ai/api/v1',
    );
    expect(environmentService.openRouterSiteUrl).toBe('https://nyx.example');
    expect(environmentService.openRouterSiteName).toBe('Nyx CV Workspace');
  });

  it('allows optional OpenAI-compatible endpoint configuration to be unset', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENROUTER_SITE_URL;
    delete process.env.OPENROUTER_SITE_NAME;

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const environmentService = module.get(EnvironmentService, {
      strict: false,
    });

    expect(environmentService.openAiBaseUrl).toBe('');
    expect(environmentService.openRouterSiteUrl).toBe('');
    expect(environmentService.openRouterSiteName).toBe('');
  });

  it('reads starter credits and per-action usage costs from env', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'mock';
    process.env.FREE_STARTER_CREDITS = '25';
    process.env.USAGE_COST_CV_ANALYSIS = '3';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const environmentService = module.get(EnvironmentService, {
      strict: false,
    });

    expect(environmentService.freeStarterCredits).toBe(25);
    expect(environmentService.usageCosts.CV_ANALYSIS).toBe(3);
  });

  it('reads AI provider input limits from env with safe defaults', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'mock';
    delete process.env.AI_MAX_CV_CHARS;
    delete process.env.AI_MAX_JD_CHARS;

    const defaultModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const defaultEnvironmentService = defaultModule.get(EnvironmentService, {
      strict: false,
    });

    expect(defaultEnvironmentService.aiMaxCvChars).toBe(8000);
    expect(defaultEnvironmentService.aiMaxJdChars).toBe(6000);

    process.env.AI_MAX_CV_CHARS = '12000';
    process.env.AI_MAX_JD_CHARS = '7000';

    const configuredModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const configuredEnvironmentService = configuredModule.get(
      EnvironmentService,
      {
        strict: false,
      },
    );

    expect(configuredEnvironmentService.aiMaxCvChars).toBe(12000);
    expect(configuredEnvironmentService.aiMaxJdChars).toBe(7000);
  });

  it('rejects invalid AI provider input limits', async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'mock';
    process.env.AI_MAX_CV_CHARS = '0';

    await expect(
      Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue({})
        .compile(),
    ).rejects.toThrow('AI_MAX_CV_CHARS must be a positive integer');
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
