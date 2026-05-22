import { Injectable } from '@nestjs/common';
import type {
  CvAnalysisProvider,
  CvAnalysisResult,
  JdMatchResult,
} from '../types/cv-analysis-provider';

@Injectable()
export class MockCvAnalysisProvider implements CvAnalysisProvider {
  readonly providerName = 'mock';
  readonly jdMatcherModelName = 'mock-jd-matcher-v1';
  private readonly cvAnalyzerModelName = 'mock-cv-analyzer-v1';

  get modelName(): string {
    return this.cvAnalyzerModelName;
  }

  analyzeCv(extractedText: string): Promise<CvAnalysisResult> {
    const normalizedText = extractedText.trim();
    const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;
    const score = Math.max(45, Math.min(85, 55 + Math.floor(wordCount / 20)));

    return Promise.resolve({
      score,
      strengths: [
        'CV text is available for structured review',
        'The CV includes enough content to produce initial feedback',
      ],
      weaknesses: [
        'Mock analysis cannot verify role-specific impact or achievements',
        'Some sections may need stronger measurable outcomes',
      ],
      suggestions: [
        'Add quantified achievements where possible',
        'Make key skills and recent experience easy to scan',
        'Tailor the summary and bullet points to the target role',
      ],
    });
  }

  matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResult> {
    const cvSkills = this.findKnownSkills(extractedText);
    const jdSkills = this.findKnownSkills(jobDescriptionText);
    const matchedSkills = jdSkills.filter((skill) => cvSkills.includes(skill));
    const missingSkills = jdSkills.filter((skill) => !cvSkills.includes(skill));
    const matchingScore =
      jdSkills.length === 0
        ? 50
        : Math.round((matchedSkills.length / jdSkills.length) * 100);

    return Promise.resolve({
      matchingScore,
      matchedSkills:
        matchedSkills.length > 0
          ? matchedSkills
          : ['CV text is available for comparison'],
      missingSkills:
        missingSkills.length > 0
          ? missingSkills
          : ['No obvious missing mock skills detected'],
      suggestions: [
        'Highlight matched skills near recent role experience',
        'Add concrete examples for missing job description requirements',
        'Tailor the CV summary to the target job description',
      ],
    });
  }

  private findKnownSkills(text: string): string[] {
    const knownSkills = [
      'TypeScript',
      'JavaScript',
      'NestJS',
      'Next.js',
      'PostgreSQL',
      'Redis',
      'BullMQ',
      'Prisma',
      'API testing',
      'Testing',
      'Docker',
      'AWS',
    ];
    const normalizedText = text.toLowerCase();

    return knownSkills.filter((skill) =>
      normalizedText.includes(skill.toLowerCase()),
    );
  }
}
