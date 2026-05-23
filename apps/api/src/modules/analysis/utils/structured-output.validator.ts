import { ServiceUnavailableException } from '@nestjs/common';
import type {
  CoverLetterResult,
  CvAnalysisResult,
  JdMatchResult,
} from '../types/cv-analysis-provider';
import type { JsonObject } from '../prompts/analysis-prompt.builder';

export function parseJsonObject(content: string): JsonObject {
  try {
    const parsed = JSON.parse(content) as unknown;

    if (!isJsonObject(parsed)) {
      throw invalidProviderOutput();
    }

    return parsed;
  } catch {
    throw invalidProviderOutput();
  }
}

export function validateCvAnalysisResult(value: JsonObject): CvAnalysisResult {
  return {
    score: normalizeScore(value.score, 'score'),
    strengths: normalizeStringArray(value.strengths, 'strengths'),
    weaknesses: normalizeStringArray(value.weaknesses, 'weaknesses'),
    suggestions: normalizeStringArray(value.suggestions, 'suggestions'),
  };
}

export function validateJdMatchResult(value: JsonObject): JdMatchResult {
  return {
    matchingScore: normalizeScore(value.matchingScore, 'matchingScore'),
    matchedSkills: normalizeStringArray(value.matchedSkills, 'matchedSkills'),
    missingSkills: normalizeStringArray(value.missingSkills, 'missingSkills'),
    suggestions: normalizeStringArray(value.suggestions, 'suggestions'),
  };
}

export function validateCoverLetterResult(
  value: JsonObject,
): CoverLetterResult {
  return {
    coverLetter: normalizeString(value.coverLetter, 'coverLetter'),
    tone: normalizeString(value.tone, 'tone'),
    highlights: normalizeStringArray(value.highlights, 'highlights'),
  };
}

function normalizeScore(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidStructuredOutput(fieldName);
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw invalidStructuredOutput(fieldName);
  }

  const normalized = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    throw invalidStructuredOutput(fieldName);
  }

  return Array.from(new Set(normalized));
}

function normalizeString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw invalidStructuredOutput(fieldName);
  }

  return value.trim();
}

function invalidStructuredOutput(
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

function invalidProviderOutput(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    error: {
      code: 'AI_PROVIDER_ERROR',
      message: 'AI provider failed to return valid structured output',
    },
    meta: {},
  });
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
