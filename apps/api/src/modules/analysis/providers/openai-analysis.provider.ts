import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EnvironmentService } from '../../../config/environment.service';
import type {
  CoverLetterGenerationInput,
  CoverLetterResult,
  CvAnalysisProvider,
  CvAnalysisResult,
  JdMatchResult,
} from '../types/cv-analysis-provider';

type JsonObject = Record<string, unknown>;

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

@Injectable()
export class OpenAiAnalysisProvider implements CvAnalysisProvider {
  readonly providerName = 'openai';

  constructor(private readonly environmentService: EnvironmentService) {}

  get modelName(): string {
    return this.environmentService.openAiModel;
  }

  get jdMatcherModelName(): string {
    return this.environmentService.openAiModel;
  }

  get coverLetterModelName(): string {
    return this.environmentService.openAiModel;
  }

  async analyzeCv(extractedText: string): Promise<CvAnalysisResult> {
    const content = await this.requestStructuredJson(
      'cv_analysis',
      this.cvAnalysisSchema(),
      [
        'Analyze the CV text and return only structured feedback.',
        'Score must reflect overall CV clarity, recruiter readability, and actionability.',
      ].join(' '),
      `CV text:\n${extractedText}`,
    );

    return this.normalizeCvAnalysis(content);
  }

  async matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResult> {
    const content = await this.requestStructuredJson(
      'job_description_match',
      this.jdMatchSchema(),
      [
        'Compare the CV with the job description and return only structured matching feedback.',
        'Do not invent skills that are not supported by the provided text.',
      ].join(' '),
      [
        `CV text:\n${extractedText}`,
        `Job description:\n${jobDescriptionText}`,
      ].join('\n\n'),
    );

    return this.normalizeJdMatch(content);
  }

  async generateCoverLetter(
    extractedText: string,
    input: CoverLetterGenerationInput,
  ): Promise<CoverLetterResult> {
    const content = await this.requestStructuredJson(
      'cover_letter',
      this.coverLetterSchema(),
      [
        'Generate a concise tailored cover letter from the CV and job description.',
        'Return only structured JSON and keep the letter editable by the user.',
      ].join(' '),
      [
        `CV text:\n${extractedText}`,
        `Job description:\n${input.jobDescriptionText}`,
        `Company name: ${input.companyName ?? 'Not provided'}`,
        `Role title: ${input.roleTitle ?? 'Not provided'}`,
        `Requested tone: ${input.tone ?? 'professional'}`,
      ].join('\n\n'),
    );

    return this.normalizeCoverLetter(content);
  }

  private async requestStructuredJson(
    schemaName: string,
    jsonSchema: JsonObject,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<JsonObject> {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.environmentService.openAiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.environmentService.openAiModel,
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: schemaName,
                strict: true,
                schema: jsonSchema,
              },
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
      }

      const body = (await response.json()) as OpenAiChatCompletionResponse;
      const content = body.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('OpenAI response did not include content');
      }

      const parsed = JSON.parse(content) as unknown;

      if (!this.isJsonObject(parsed)) {
        throw new Error('OpenAI response content was not a JSON object');
      }

      return parsed;
    } catch {
      throw new ServiceUnavailableException({
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: 'AI provider failed to return valid structured output',
        },
        meta: {},
      });
    }
  }

  private normalizeCvAnalysis(value: JsonObject): CvAnalysisResult {
    return {
      score: this.normalizeScore(value.score, 'score'),
      strengths: this.normalizeStringArray(value.strengths, 'strengths'),
      weaknesses: this.normalizeStringArray(value.weaknesses, 'weaknesses'),
      suggestions: this.normalizeStringArray(value.suggestions, 'suggestions'),
    };
  }

  private normalizeJdMatch(value: JsonObject): JdMatchResult {
    return {
      matchingScore: this.normalizeScore(value.matchingScore, 'matchingScore'),
      matchedSkills: this.normalizeStringArray(
        value.matchedSkills,
        'matchedSkills',
      ),
      missingSkills: this.normalizeStringArray(
        value.missingSkills,
        'missingSkills',
      ),
      suggestions: this.normalizeStringArray(value.suggestions, 'suggestions'),
    };
  }

  private normalizeCoverLetter(value: JsonObject): CoverLetterResult {
    return {
      coverLetter: this.normalizeString(value.coverLetter, 'coverLetter'),
      tone: this.normalizeString(value.tone, 'tone'),
      highlights: this.normalizeStringArray(value.highlights, 'highlights'),
    };
  }

  private normalizeScore(value: unknown, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw this.invalidStructuredOutput(fieldName);
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private normalizeStringArray(value: unknown, fieldName: string): string[] {
    if (!Array.isArray(value)) {
      throw this.invalidStructuredOutput(fieldName);
    }

    const normalized = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);

    if (normalized.length === 0) {
      throw this.invalidStructuredOutput(fieldName);
    }

    return normalized;
  }

  private normalizeString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw this.invalidStructuredOutput(fieldName);
    }

    return value.trim();
  }

  private invalidStructuredOutput(
    fieldName: string,
  ): ServiceUnavailableException {
    return new ServiceUnavailableException({
      error: {
        code: 'AI_PROVIDER_ERROR',
        message: `AI provider returned invalid structured output for ${fieldName}`,
      },
      meta: {},
    });
  }

  private isJsonObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private cvAnalysisSchema(): JsonObject {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'strengths', 'weaknesses', 'suggestions'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        strengths: this.stringArraySchema(),
        weaknesses: this.stringArraySchema(),
        suggestions: this.stringArraySchema(),
      },
    };
  }

  private jdMatchSchema(): JsonObject {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'matchingScore',
        'matchedSkills',
        'missingSkills',
        'suggestions',
      ],
      properties: {
        matchingScore: { type: 'number', minimum: 0, maximum: 100 },
        matchedSkills: this.stringArraySchema(),
        missingSkills: this.stringArraySchema(),
        suggestions: this.stringArraySchema(),
      },
    };
  }

  private coverLetterSchema(): JsonObject {
    return {
      type: 'object',
      additionalProperties: false,
      required: ['coverLetter', 'tone', 'highlights'],
      properties: {
        coverLetter: { type: 'string', minLength: 1 },
        tone: { type: 'string', minLength: 1 },
        highlights: this.stringArraySchema(),
      },
    };
  }

  private stringArraySchema(): JsonObject {
    return {
      type: 'array',
      minItems: 1,
      items: { type: 'string', minLength: 1 },
    };
  }
}
