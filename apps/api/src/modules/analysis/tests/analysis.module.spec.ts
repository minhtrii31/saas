import { Test } from '@nestjs/testing';
import { EnvironmentService } from '../../../config/environment.service';
import { AnalysisModule } from '../analysis.module';
import { MockCvAnalysisProvider } from '../providers/mock-cv-analysis.provider';
import { OpenAiAnalysisProvider } from '../providers/openai-analysis.provider';
import { CV_ANALYSIS_PROVIDER } from '../tokens/cv-analysis-provider.token';
import type { CvAnalysisProvider } from '../types/cv-analysis-provider';

describe('AnalysisModule provider selection', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAiProvider = process.env.AI_PROVIDER;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.AI_PROVIDER = originalAiProvider;
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    process.env.OPENAI_MODEL = originalOpenAiModel;
  });

  it('uses the mock provider by default', async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.OPENAI_API_KEY;

    const module = await Test.createTestingModule({
      imports: [AnalysisModule],
    }).compile();

    const provider = module.get<CvAnalysisProvider>(CV_ANALYSIS_PROVIDER);

    expect(provider).toBeInstanceOf(MockCvAnalysisProvider);
    expect(provider.providerName).toBe('mock');
  });

  it('uses OpenAI provider when AI_PROVIDER=openai', async () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENAI_MODEL = 'gpt-test-model';

    const module = await Test.createTestingModule({
      imports: [AnalysisModule],
    }).compile();

    const provider = module.get<CvAnalysisProvider>(CV_ANALYSIS_PROVIDER);

    expect(provider).toBeInstanceOf(OpenAiAnalysisProvider);
    expect(provider.providerName).toBe('openai');
    expect(provider.modelName).toBe('gpt-test-model');
  });

  it('normalizes provider selection from surrounding whitespace and case', async () => {
    process.env.AI_PROVIDER = ' OpenAI ';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.OPENAI_MODEL;

    const module = await Test.createTestingModule({
      imports: [AnalysisModule],
    }).compile();

    const provider = module.get<CvAnalysisProvider>(CV_ANALYSIS_PROVIDER);
    const environmentService = module.get(EnvironmentService);

    expect(provider).toBeInstanceOf(OpenAiAnalysisProvider);
    expect(environmentService.aiProvider).toBe('openai');
    expect(provider.modelName).toBe('gpt-4.1-mini');
  });
});
