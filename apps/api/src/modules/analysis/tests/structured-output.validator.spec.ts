import { ServiceUnavailableException } from '@nestjs/common';
import {
  parseJsonObject,
  validateCoverLetterResult,
  validateCvAnalysisResult,
  validateJdMatchResult,
  validateRewriteRefinementResult,
  validateResumeRewriteResult,
} from '../utils/structured-output.validator';

describe('structured output validator', () => {
  it('parses JSON objects and rejects non-object JSON', () => {
    expect(parseJsonObject('{"score":72}')).toEqual({ score: 72 });
    expect(() => parseJsonObject('[1,2,3]')).toThrow(
      ServiceUnavailableException,
    );
  });

  it('normalizes valid CV analysis output', () => {
    expect(
      validateCvAnalysisResult({
        score: 88.6,
        scoringCategories: {
          atsReadiness: 82.4,
          readability: 91,
          impact: 77,
          keywordOptimization: 74,
          structure: 80,
          experienceQuality: 86,
        },
        strengths: [' Clear impact '],
        weaknesses: [' Needs metrics '],
        actionableInsights: {
          missingQuantifiedAchievements: [' Add revenue or usage metrics '],
          weakActionVerbs: ['Responsible for is weaker than Led or Built'],
          missingSections: ['No certifications section is visible'],
          overlyGenericWording: ['Hard working team player'],
          formattingConcerns: ['Long paragraph blocks reduce scanability'],
          keywordGaps: ['Cloud platform keywords are light'],
        },
        suggestions: [' Add outcomes '],
      }),
    ).toEqual({
      score: 89,
      scoringCategories: {
        atsReadiness: 82,
        readability: 91,
        impact: 77,
        keywordOptimization: 74,
        structure: 80,
        experienceQuality: 86,
      },
      strengths: ['Clear impact'],
      weaknesses: ['Needs metrics'],
      actionableInsights: {
        missingQuantifiedAchievements: ['Add revenue or usage metrics'],
        weakActionVerbs: ['Responsible for is weaker than Led or Built'],
        missingSections: ['No certifications section is visible'],
        overlyGenericWording: ['Hard working team player'],
        formattingConcerns: ['Long paragraph blocks reduce scanability'],
        keywordGaps: ['Cloud platform keywords are light'],
      },
      suggestions: ['Add outcomes'],
    });
  });

  it('rejects CV analysis output with empty required arrays', () => {
    expect(() =>
      validateCvAnalysisResult({
        score: 75,
        scoringCategories: {
          atsReadiness: 70,
          readability: 70,
          impact: 70,
          keywordOptimization: 70,
          structure: 70,
          experienceQuality: 70,
        },
        strengths: [],
        weaknesses: ['Needs metrics'],
        actionableInsights: {
          missingQuantifiedAchievements: ['Needs metrics'],
          weakActionVerbs: ['Uses helped'],
          missingSections: ['Needs summary'],
          overlyGenericWording: ['Generic wording'],
          formattingConcerns: ['Dense text'],
          keywordGaps: ['Needs role keywords'],
        },
        suggestions: ['Add outcomes'],
      }),
    ).toThrow(ServiceUnavailableException);
  });

  it('rejects CV analysis output missing a scoring category', () => {
    expect(() =>
      validateCvAnalysisResult({
        score: 75,
        scoringCategories: {
          atsReadiness: 70,
          readability: 70,
          impact: 70,
          keywordOptimization: 70,
          structure: 70,
        },
        strengths: ['Clear skills'],
        weaknesses: ['Needs metrics'],
        actionableInsights: {
          missingQuantifiedAchievements: ['Needs metrics'],
          weakActionVerbs: ['Uses helped'],
          missingSections: ['Needs summary'],
          overlyGenericWording: ['Generic wording'],
          formattingConcerns: ['Dense text'],
          keywordGaps: ['Needs role keywords'],
        },
        suggestions: ['Add outcomes'],
      }),
    ).toThrow(ServiceUnavailableException);
  });

  it('normalizes JD match and clamps score values', () => {
    expect(
      validateJdMatchResult({
        matchingScore: 101,
        matchedSkills: [' TypeScript '],
        missingSkills: [' Redis '],
        suggestions: [' Show Redis-adjacent work '],
      }),
    ).toEqual({
      matchingScore: 100,
      matchedSkills: ['TypeScript'],
      missingSkills: ['Redis'],
      suggestions: ['Show Redis-adjacent work'],
    });
  });

  it('normalizes cover letter output', () => {
    expect(
      validateCoverLetterResult({
        coverLetter: ' Tailored letter ',
        tone: ' professional ',
        highlights: [' NestJS APIs '],
      }),
    ).toEqual({
      coverLetter: 'Tailored letter',
      tone: 'professional',
      highlights: ['NestJS APIs'],
    });
  });

  it('normalizes resume rewrite output', () => {
    expect(
      validateResumeRewriteResult({
        originalText: ' Helped with APIs ',
        rewrittenText: ' Delivered API improvements ',
        explanation: ' Stronger action verb ',
        rewriteGoal: 'stronger-impact',
      }),
    ).toEqual({
      originalText: 'Helped with APIs',
      rewrittenText: 'Delivered API improvements',
      explanation: 'Stronger action verb',
      rewriteGoal: 'stronger-impact',
    });
  });

  it('rejects resume rewrite output with an unsupported goal', () => {
    expect(() =>
      validateResumeRewriteResult({
        originalText: 'Helped with APIs',
        rewrittenText: 'Delivered API improvements',
        explanation: 'Stronger action verb',
        rewriteGoal: 'unsupported-goal',
      }),
    ).toThrow(ServiceUnavailableException);
  });

  it('normalizes rewrite refinement output', () => {
    expect(
      validateRewriteRefinementResult({
        improved: ' Owned API delivery ',
        reason: ' Stronger ownership ',
      }),
    ).toEqual({
      improved: 'Owned API delivery',
      reason: 'Stronger ownership',
    });
  });

  it('rejects rewrite refinement output with an empty improved field', () => {
    expect(() =>
      validateRewriteRefinementResult({
        improved: ' ',
        reason: 'Stronger ownership',
      }),
    ).toThrow(ServiceUnavailableException);
  });
});
