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
    const matchJobDescription = jest.fn();
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      analyzeCv,
      matchJobDescription,
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

  it('delegates JD matching to the configured provider and returns JD matcher metadata', async () => {
    const analyzeCv = jest.fn();
    const matchJobDescription = jest.fn().mockResolvedValue({
      matchingScore: 75,
      matchedSkills: ['TypeScript', 'NestJS'],
      missingSkills: ['Redis'],
      suggestions: ['Add Redis experience'],
    });
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      analyzeCv,
      matchJobDescription,
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

    await expect(
      service.matchJobDescription('extracted cv text', 'job description'),
    ).resolves.toEqual({
      aiProvider: 'mock',
      aiModel: 'mock-jd-matcher-v1',
      result: {
        matchingScore: 75,
        matchedSkills: ['TypeScript', 'NestJS'],
        missingSkills: ['Redis'],
        suggestions: ['Add Redis experience'],
      },
    });
    expect(matchJobDescription).toHaveBeenCalledWith(
      'extracted cv text',
      'job description',
    );
  });
});
