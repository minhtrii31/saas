import { EnvironmentService } from '../../../config/environment.service';
import { OpenAiAnalysisProvider } from '../providers/openai-analysis.provider';

describe('OpenAiAnalysisProvider', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAiProvider = process.env.AI_PROVIDER;
  const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
  const originalOpenAiModel = process.env.OPENAI_MODEL;
  const originalOpenAiBaseUrl = process.env.OPENAI_BASE_URL;
  const originalOpenRouterSiteUrl = process.env.OPENROUTER_SITE_URL;
  const originalOpenRouterSiteName = process.env.OPENROUTER_SITE_NAME;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENAI_MODEL = 'gpt-test-model';
    delete process.env.OPENAI_BASE_URL;
    delete process.env.OPENROUTER_SITE_URL;
    delete process.env.OPENROUTER_SITE_NAME;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.AI_PROVIDER = originalAiProvider;
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
    process.env.OPENAI_MODEL = originalOpenAiModel;
    restoreEnv('OPENAI_BASE_URL', originalOpenAiBaseUrl);
    restoreEnv('OPENROUTER_SITE_URL', originalOpenRouterSiteUrl);
    restoreEnv('OPENROUTER_SITE_NAME', originalOpenRouterSiteName);
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

  it('uses the default OpenAI endpoint when OPENAI_BASE_URL is not set', async () => {
    global.fetch = successfulAnalysisFetch();

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await provider.analyzeCv('CV text');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.any(Object),
    );
  });

  it('uses a custom OpenAI-compatible base URL when configured', async () => {
    process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1';
    process.env.OPENAI_MODEL = 'openai/gpt-4.1-mini';
    global.fetch = successfulAnalysisFetch();

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await provider.analyzeCv('CV text');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    const fetchMock = global.fetch as jest.Mock;
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.model).toBe('openai/gpt-4.1-mini');
  });

  it('sends optional OpenRouter headers when configured', async () => {
    process.env.OPENAI_BASE_URL = 'https://openrouter.ai/api/v1/';
    process.env.OPENROUTER_SITE_URL = 'https://nyx.example';
    process.env.OPENROUTER_SITE_NAME = 'Nyx CV Workspace';
    global.fetch = successfulAnalysisFetch();

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await provider.analyzeCv('CV text');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          'HTTP-Referer': 'https://nyx.example',
          'X-OpenRouter-Title': 'Nyx CV Workspace',
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

  it('normalizes rewrite refinement output before returning it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                improved: ' Owned API delivery ',
                reason: ' Stronger ownership ',
              }),
            },
          },
        ],
      }),
    });

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(
      provider.refineRewrite('CV text', {
        original: 'Helped with APIs',
        currentRewrite: 'Delivered API improvements',
        instruction: 'stronger',
      }),
    ).resolves.toEqual({
      improved: 'Owned API delivery',
      reason: 'Stronger ownership',
    });

    const fetchMock = global.fetch as jest.Mock;
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.response_format.json_schema.name).toBe(
      'rewrite_refinement',
    );
  });

  it('normalizes interview prep output before returning it', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                focus: ' technical ',
                questions: [
                  {
                    question: ' Explain a NestJS API you built. ',
                    whyItMatters: ' Tests practical backend depth. ',
                    suggestedAnswerDirection:
                      ' Anchor the answer in a shipped API. ',
                  },
                ],
                weakPointFocusAreas: [' Prepare Redis tradeoffs '],
              }),
            },
          },
        ],
      }),
    });

    const provider = new OpenAiAnalysisProvider(new EnvironmentService());

    await expect(
      provider.generateInterviewPrep('CV text', {
        interviewFocus: 'technical',
        jobDescriptionText: 'JD text',
      }),
    ).resolves.toEqual({
      focus: 'technical',
      questions: [
        {
          question: 'Explain a NestJS API you built.',
          whyItMatters: 'Tests practical backend depth.',
          suggestedAnswerDirection: 'Anchor the answer in a shipped API.',
        },
      ],
      weakPointFocusAreas: ['Prepare Redis tradeoffs'],
    });

    const fetchMock = global.fetch as jest.Mock;
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.response_format.json_schema.name).toBe('interview_prep');
  });
});

function successfulAnalysisFetch(): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              score: 80,
              scoringCategories: {
                atsReadiness: 80,
                readability: 80,
                impact: 80,
                keywordOptimization: 80,
                structure: 80,
                experienceQuality: 80,
              },
              strengths: ['Clear scope'],
              weaknesses: ['Needs metrics'],
              actionableInsights: {
                missingQuantifiedAchievements: ['Add delivery metrics'],
                weakActionVerbs: ['Replace helped'],
                missingSections: ['Add summary'],
                overlyGenericWording: ['Remove generic phrases'],
                formattingConcerns: ['Use shorter bullets'],
                keywordGaps: ['Add backend keywords'],
              },
              suggestions: ['Add numbers'],
            }),
          },
        },
      ],
    }),
  });
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
