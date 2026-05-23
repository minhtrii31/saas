import { Injectable } from '@nestjs/common';

export type AiProviderName = 'mock' | 'openai';

@Injectable()
export class EnvironmentService {
  readonly aiProvider: AiProviderName;
  readonly openAiApiKey: string;
  readonly openAiModel: string;
  readonly freeStarterCredits: number;
  readonly usageCosts: Record<string, number>;

  constructor() {
    this.require('JWT_SECRET');
    this.aiProvider = this.readAiProvider();
    this.openAiApiKey =
      this.aiProvider === 'openai'
        ? this.requireOpenAiApiKey()
        : this.optional('OPENAI_API_KEY');
    this.openAiModel = this.optional('OPENAI_MODEL', 'gpt-4.1-mini');
    this.freeStarterCredits = this.nonNegativeInt('FREE_STARTER_CREDITS', 10);
    this.usageCosts = {
      CV_ANALYSIS: this.nonNegativeInt('USAGE_COST_CV_ANALYSIS', 1),
      JD_MATCH: this.nonNegativeInt('USAGE_COST_JD_MATCH', 1),
      COVER_LETTER: this.nonNegativeInt('USAGE_COST_COVER_LETTER', 1),
      RESUME_REWRITE: this.nonNegativeInt('USAGE_COST_RESUME_REWRITE', 1),
      REWRITE_REFINEMENT: this.nonNegativeInt(
        'USAGE_COST_REWRITE_REFINEMENT',
        1,
      ),
      INTERVIEW_PREP: this.nonNegativeInt('USAGE_COST_INTERVIEW_PREP', 1),
      APPLICATION_FOLLOW_UP: this.nonNegativeInt(
        'USAGE_COST_APPLICATION_FOLLOW_UP',
        1,
      ),
    };
  }

  private require(name: string): string {
    const value = process.env[name];

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${name} is required`);
    }

    return value;
  }

  optional(name: string, defaultValue?: string): string {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return '';
  }

  optionalInt(name: string, defaultValue: number): number {
    const value = this.optional(name);
    if (!value) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private nonNegativeInt(name: string, defaultValue: number): number {
    const value = this.optional(name);
    if (!value) {
      return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(`${name} must be a non-negative integer`);
    }

    return parsed;
  }

  private readAiProvider(): AiProviderName {
    const value = this.optional('AI_PROVIDER', 'mock').trim().toLowerCase();

    if (value === 'mock' || value === 'openai') {
      return value;
    }

    throw new Error('AI_PROVIDER must be mock or openai');
  }

  private requireOpenAiApiKey(): string {
    const value = this.optional('OPENAI_API_KEY');

    if (!value) {
      throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai');
    }

    return value;
  }
}
