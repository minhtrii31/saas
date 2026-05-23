import { EnvironmentService } from '../../../config/environment.service';
import { OpenAiAnalysisProvider } from '../providers/openai-analysis.provider';

describe('OpenAiAnalysisProvider', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAiProvider = process.env.AI_PROVIDER;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENAI_MODEL = 'gpt-test-model';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.AI_PROVIDER = originalAiProvider;
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    process.env.OPENAI_MODEL = originalOpenAiModel;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('requests structured JSON output and normalizes CV analysis', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 88.6,
                scoringCategories: {
                  atsReadiness: 80,
                  readability: 91,
                  impact: 76,
                  keywordOptimization: 72,
                  structure: 84,
                  experienceQuality: 87,
                },
                strengths: [' Clear impact '],
                weaknesses: ['Needs metrics'],
                actionableInsights: {
                  missingQuantifiedAchievements: ['Add scale to API work'],
                  weakActionVerbs: ['Replace helped with owned'],
                  missingSections: ['Add a focused summary'],
                  overlyGenericWording: ['Remove proven team player'],
                  formattingConcerns: ['Split dense paragraphs'],
                  keywordGaps: ['Add role-specific backend keywords'],
                },
                suggestions: ['Add quantified achievements'],
              }),
            },
          },
        ],
      }),
    });
    global.fetch = fetchMock;

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(provider.analyzeCv('TypeScript CV text')).resolves.toEqual({
      score: 89,
      scoringCategories: {
        atsReadiness: 80,
        readability: 91,
        impact: 76,
        keywordOptimization: 72,
        structure: 84,
        experienceQuality: 87,
      },
      strengths: ['Clear impact'],
      weaknesses: ['Needs metrics'],
      actionableInsights: {
        missingQuantifiedAchievements: ['Add scale to API work'],
        weakActionVerbs: ['Replace helped with owned'],
        missingSections: ['Add a focused summary'],
        overlyGenericWording: ['Remove proven team player'],
        formattingConcerns: ['Split dense paragraphs'],
        keywordGaps: ['Add role-specific backend keywords'],
      },
      suggestions: ['Add quantified achievements'],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-openai-key',
        }),
      }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.model).toBe('gpt-test-model');
    expect(requestBody.response_format).toEqual(
      expect.objectContaining({
        type: 'json_schema',
        json_schema: expect.objectContaining({
          strict: true,
          name: 'cv_analysis',
        }),
      }),
    );
  });

  it('returns a clean provider error for invalid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'not-json',
            },
          },
        ],
      }),
    });

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(provider.analyzeCv('CV text')).rejects.toMatchObject({
      response: {
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: 'AI provider failed to return valid structured output',
        },
        meta: {},
      },
    });
  });

  it('normalizes JD match output before returning it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                matchingScore: 101,
                matchedSkills: [' TypeScript '],
                missingSkills: ['Redis'],
                suggestions: ['Show Redis-adjacent work'],
              }),
            },
          },
        ],
      }),
    });

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(
      provider.matchJobDescription('CV text', 'JD text'),
    ).resolves.toEqual({
      matchingScore: 100,
      matchedSkills: ['TypeScript'],
      missingSkills: ['Redis'],
      suggestions: ['Show Redis-adjacent work'],
    });
  });

  it('normalizes cover letter output before returning it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                coverLetter: ' Tailored letter ',
                tone: ' professional ',
                highlights: [' NestJS '],
              }),
            },
          },
        ],
      }),
    });

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(
      provider.generateCoverLetter('CV text', {
        jobDescriptionText: 'JD text',
      }),
    ).resolves.toEqual({
      coverLetter: 'Tailored letter',
      tone: 'professional',
      highlights: ['NestJS'],
    });
  });

  it('normalizes resume rewrite output before returning it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                originalText: ' Helped with APIs ',
                rewrittenText: ' Delivered API improvements ',
                explanation: ' Stronger verb and clearer impact ',
                rewriteGoal: 'stronger-impact',
              }),
            },
          },
        ],
      }),
    });

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(
      provider.rewriteResume('CV text', {
        originalText: 'Helped with APIs',
        rewriteGoal: 'stronger-impact',
      }),
    ).resolves.toEqual({
      originalText: 'Helped with APIs',
      rewrittenText: 'Delivered API improvements',
      explanation: 'Stronger verb and clearer impact',
      rewriteGoal: 'stronger-impact',
    });

    const fetchMock = global.fetch as jest.Mock;
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.response_format.json_schema.name).toBe('resume_rewrite');
  });
});
