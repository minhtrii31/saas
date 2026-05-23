import { ServiceUnavailableException } from '@nestjs/common';
import type {
  CoverLetterResult,
  CvActionableInsights,
  CvAnalysisResult,
  CvScoringCategories,
  InterviewFocus,
  InterviewPrepQuestion,
  InterviewPrepResult,
  JdMatchResult,
  ResumeRewriteGoal,
  ResumeRewriteResult,
  RewriteRefinementResult,
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
    scoringCategories: normalizeScoringCategories(value.scoringCategories),
    strengths: normalizeStringArray(value.strengths, 'strengths'),
    weaknesses: normalizeStringArray(value.weaknesses, 'weaknesses'),
    actionableInsights: normalizeActionableInsights(value.actionableInsights),
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

export function validateResumeRewriteResult(
  value: JsonObject,
): ResumeRewriteResult {
  return {
    originalText: normalizeString(value.originalText, 'originalText'),
    rewrittenText: normalizeString(value.rewrittenText, 'rewrittenText'),
    explanation: normalizeString(value.explanation, 'explanation'),
    rewriteGoal: normalizeRewriteGoal(value.rewriteGoal),
  };
}

export function validateRewriteRefinementResult(
  value: JsonObject,
): RewriteRefinementResult {
  return {
    improved: normalizeString(value.improved, 'improved'),
    reason: normalizeString(value.reason, 'reason'),
  };
}

export function validateInterviewPrepResult(
  value: JsonObject,
): InterviewPrepResult {
  return {
    focus: normalizeInterviewFocus(value.focus),
    questions: normalizeInterviewPrepQuestions(value.questions),
    weakPointFocusAreas: normalizeStringArray(
      value.weakPointFocusAreas,
      'weakPointFocusAreas',
    ),
  };
}

function normalizeScore(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidStructuredOutput(fieldName);
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeScoringCategories(value: unknown): CvScoringCategories {
  if (!isJsonObject(value)) {
    throw invalidStructuredOutput('scoringCategories');
  }

  return {
    atsReadiness: normalizeScore(value.atsReadiness, 'atsReadiness'),
    readability: normalizeScore(value.readability, 'readability'),
    impact: normalizeScore(value.impact, 'impact'),
    keywordOptimization: normalizeScore(
      value.keywordOptimization,
      'keywordOptimization',
    ),
    structure: normalizeScore(value.structure, 'structure'),
    experienceQuality: normalizeScore(
      value.experienceQuality,
      'experienceQuality',
    ),
  };
}

function normalizeActionableInsights(value: unknown): CvActionableInsights {
  if (!isJsonObject(value)) {
    throw invalidStructuredOutput('actionableInsights');
  }

  return {
    missingQuantifiedAchievements: normalizeStringArray(
      value.missingQuantifiedAchievements,
      'missingQuantifiedAchievements',
    ),
    weakActionVerbs: normalizeStringArray(
      value.weakActionVerbs,
      'weakActionVerbs',
    ),
    missingSections: normalizeStringArray(
      value.missingSections,
      'missingSections',
    ),
    overlyGenericWording: normalizeStringArray(
      value.overlyGenericWording,
      'overlyGenericWording',
    ),
    formattingConcerns: normalizeStringArray(
      value.formattingConcerns,
      'formattingConcerns',
    ),
    keywordGaps: normalizeStringArray(value.keywordGaps, 'keywordGaps'),
  };
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

function normalizeRewriteGoal(value: unknown): ResumeRewriteGoal {
  const normalized = normalizeString(value, 'rewriteGoal');

  if (isResumeRewriteGoal(normalized)) {
    return normalized;
  }

  throw invalidStructuredOutput('rewriteGoal');
}

function normalizeInterviewPrepQuestions(
  value: unknown,
): InterviewPrepQuestion[] {
  if (!Array.isArray(value)) {
    throw invalidStructuredOutput('questions');
  }

  const questions = value.map((item) => {
    if (!isJsonObject(item)) {
      throw invalidStructuredOutput('questions');
    }

    const normalized: InterviewPrepQuestion = {
      question: normalizeString(item.question, 'question'),
      whyItMatters: normalizeString(item.whyItMatters, 'whyItMatters'),
      suggestedAnswerDirection: normalizeString(
        item.suggestedAnswerDirection,
        'suggestedAnswerDirection',
      ),
    };

    if (item.starGuidance !== undefined && item.starGuidance !== null) {
      normalized.starGuidance = normalizeStarGuidance(item.starGuidance);
    }

    return normalized;
  });

  if (questions.length === 0) {
    throw invalidStructuredOutput('questions');
  }

  return questions;
}

function normalizeStarGuidance(value: unknown) {
  if (!isJsonObject(value)) {
    throw invalidStructuredOutput('starGuidance');
  }

  return {
    situation: normalizeString(value.situation, 'situation'),
    task: normalizeString(value.task, 'task'),
    action: normalizeString(value.action, 'action'),
    result: normalizeString(value.result, 'result'),
  };
}

function normalizeInterviewFocus(value: unknown): InterviewFocus {
  const normalized = normalizeString(value, 'focus');

  if (isInterviewFocus(normalized)) {
    return normalized;
  }

  throw invalidStructuredOutput('focus');
}

function isInterviewFocus(value: string): value is InterviewFocus {
  return ['behavioral', 'technical', 'mixed'].includes(value);
}

function isResumeRewriteGoal(value: string): value is ResumeRewriteGoal {
  return [
    'stronger-impact',
    'ats-optimization',
    'concise',
    'quantified-achievements',
    'leadership-tone',
  ].includes(value);
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
