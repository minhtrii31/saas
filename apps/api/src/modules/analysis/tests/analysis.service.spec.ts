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
    const generateCoverLetter = jest.fn();
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
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
    const generateCoverLetter = jest.fn();
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
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

  it('delegates cover letter generation to the configured provider and returns cover letter model metadata', async () => {
    const analyzeCv = jest.fn();
    const matchJobDescription = jest.fn();
    const generateCoverLetter = jest.fn().mockResolvedValue({
      coverLetter: 'Dear Example Corp, I am excited to apply.',
      tone: 'professional',
      highlights: ['TypeScript experience'],
    });
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
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
      service.generateCoverLetter('extracted cv text', {
        jobDescriptionText: 'job description',
        companyName: 'Example Corp',
        roleTitle: 'Backend Engineer',
      }),
    ).resolves.toEqual({
      aiProvider: 'mock',
      aiModel: 'mock-cover-letter-v1',
      result: {
        coverLetter: 'Dear Example Corp, I am excited to apply.',
        tone: 'professional',
        highlights: ['TypeScript experience'],
      },
    });
    expect(generateCoverLetter).toHaveBeenCalledWith('extracted cv text', {
      jobDescriptionText: 'job description',
      companyName: 'Example Corp',
      roleTitle: 'Backend Engineer',
    });
  });
});
