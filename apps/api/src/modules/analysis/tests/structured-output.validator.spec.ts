import { ServiceUnavailableException } from '@nestjs/common';
import {
  parseJsonObject,
  validateCoverLetterResult,
  validateCvAnalysisResult,
  validateJdMatchResult,
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
        strengths: [' Clear impact '],
        weaknesses: [' Needs metrics '],
        suggestions: [' Add outcomes '],
      }),
    ).toEqual({
      score: 89,
      strengths: ['Clear impact'],
      weaknesses: ['Needs metrics'],
      suggestions: ['Add outcomes'],
    });
  });

  it('rejects CV analysis output with empty required arrays', () => {
    expect(() =>
      validateCvAnalysisResult({
        score: 75,
        strengths: [],
        weaknesses: ['Needs metrics'],
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
});
