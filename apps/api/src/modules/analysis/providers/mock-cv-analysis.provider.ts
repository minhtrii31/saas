import { Injectable } from '@nestjs/common';
import type {
  CvAnalysisProvider,
  CvAnalysisResult,
} from '../types/cv-analysis-provider';

@Injectable()
export class MockCvAnalysisProvider implements CvAnalysisProvider {
  readonly providerName = 'mock';
  readonly modelName = 'mock-cv-analyzer-v1';

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
}
