import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisService } from '../analysis.service';
import { CV_ANALYSIS_PROVIDER } from '../tokens/cv-analysis-provider.token';
import type { CvAnalysisProvider } from '../types/cv-analysis-provider';

describe('AnalysisService', () => {
  it('delegates CV analysis to the configured provider and returns provider metadata', async () => {
    const analyzeCv = jest.fn().mockResolvedValue({
      score: 72,
      strengths: ['Clear technical stack'],
      weaknesses: ['Needs quantified achievements'],
      suggestions: ['Add measurable outcomes'],
    });
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      analyzeCv,
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        {
          provide: CV_ANALYSIS_PROVIDER,
          useValue: provider,
        },
      ],
    }).compile();
    const service = module.get(AnalysisService);

    await expect(service.analyzeCv('extracted cv text')).resolves.toEqual({
      aiProvider: 'mock',
      aiModel: 'mock-cv-analyzer-v1',
      result: {
        score: 72,
        strengths: ['Clear technical stack'],
        weaknesses: ['Needs quantified achievements'],
        suggestions: ['Add measurable outcomes'],
      },
    });
    expect(analyzeCv).toHaveBeenCalledWith('extracted cv text');
  });
});
