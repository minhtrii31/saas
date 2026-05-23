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
    const rewriteResume = jest.fn();
    const refineRewrite = jest.fn();
    const generateInterviewPrep = jest.fn();
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      resumeRewriteModelName: 'mock-resume-rewrite-v1',
      interviewPrepModelName: 'mock-interview-prep-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
      rewriteResume,
      refineRewrite,
      generateInterviewPrep,
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
    const rewriteResume = jest.fn();
    const refineRewrite = jest.fn();
    const generateInterviewPrep = jest.fn();
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      resumeRewriteModelName: 'mock-resume-rewrite-v1',
      interviewPrepModelName: 'mock-interview-prep-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
      rewriteResume,
      refineRewrite,
      generateInterviewPrep,
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
    const rewriteResume = jest.fn();
    const refineRewrite = jest.fn();
    const generateInterviewPrep = jest.fn();
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      resumeRewriteModelName: 'mock-resume-rewrite-v1',
      interviewPrepModelName: 'mock-interview-prep-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
      rewriteResume,
      refineRewrite,
      generateInterviewPrep,
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

  it('delegates resume rewriting to the configured provider and returns rewrite model metadata', async () => {
    const analyzeCv = jest.fn();
    const matchJobDescription = jest.fn();
    const generateCoverLetter = jest.fn();
    const refineRewrite = jest.fn();
    const generateInterviewPrep = jest.fn();
    const rewriteResume = jest.fn().mockResolvedValue({
      originalText: 'Helped with APIs',
      rewrittenText: 'Delivered API improvements',
      explanation: 'Stronger action verb',
      rewriteGoal: 'stronger-impact',
    });
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      resumeRewriteModelName: 'mock-resume-rewrite-v1',
      interviewPrepModelName: 'mock-interview-prep-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
      rewriteResume,
      refineRewrite,
      generateInterviewPrep,
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
      service.rewriteResume('extracted cv text', {
        originalText: 'Helped with APIs',
        rewriteGoal: 'stronger-impact',
      }),
    ).resolves.toEqual({
      aiProvider: 'mock',
      aiModel: 'mock-resume-rewrite-v1',
      result: {
        originalText: 'Helped with APIs',
        rewrittenText: 'Delivered API improvements',
        explanation: 'Stronger action verb',
        rewriteGoal: 'stronger-impact',
      },
    });
    expect(rewriteResume).toHaveBeenCalledWith('extracted cv text', {
      originalText: 'Helped with APIs',
      rewriteGoal: 'stronger-impact',
    });
  });

  it('delegates rewrite refinement to the configured provider and returns rewrite model metadata', async () => {
    const analyzeCv = jest.fn();
    const matchJobDescription = jest.fn();
    const generateCoverLetter = jest.fn();
    const rewriteResume = jest.fn();
    const generateInterviewPrep = jest.fn();
    const refineRewrite = jest.fn().mockResolvedValue({
      improved: 'Owned API delivery with clearer technical impact',
      reason: 'Adds stronger ownership and technical detail',
    });
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      resumeRewriteModelName: 'mock-resume-rewrite-v1',
      interviewPrepModelName: 'mock-interview-prep-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
      rewriteResume,
      refineRewrite,
      generateInterviewPrep,
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
      service.refineRewrite('extracted cv text', {
        original: 'Helped with APIs',
        currentRewrite: 'Delivered API improvements',
        instruction: 'more-technical',
      }),
    ).resolves.toEqual({
      aiProvider: 'mock',
      aiModel: 'mock-resume-rewrite-v1',
      result: {
        improved: 'Owned API delivery with clearer technical impact',
        reason: 'Adds stronger ownership and technical detail',
      },
    });
    expect(refineRewrite).toHaveBeenCalledWith('extracted cv text', {
      original: 'Helped with APIs',
      currentRewrite: 'Delivered API improvements',
      instruction: 'more-technical',
    });
  });

  it('delegates interview prep generation to the configured provider and returns interview prep model metadata', async () => {
    const analyzeCv = jest.fn();
    const matchJobDescription = jest.fn();
    const generateCoverLetter = jest.fn();
    const rewriteResume = jest.fn();
    const refineRewrite = jest.fn();
    const generateInterviewPrep = jest.fn().mockResolvedValue({
      focus: 'mixed',
      questions: [
        {
          question: 'Tell me about an API you improved.',
          whyItMatters: 'Tests impact and ownership.',
          suggestedAnswerDirection: 'Use a recent API example with scope.',
          starGuidance: {
            situation: 'Backend system context',
            task: 'Reliability or performance goal',
            action: 'Specific TypeScript and NestJS work',
            result: 'Measured outcome',
          },
        },
      ],
      weakPointFocusAreas: ['Quantify API outcomes'],
    });
    const provider: CvAnalysisProvider = {
      providerName: 'mock',
      modelName: 'mock-cv-analyzer-v1',
      jdMatcherModelName: 'mock-jd-matcher-v1',
      coverLetterModelName: 'mock-cover-letter-v1',
      resumeRewriteModelName: 'mock-resume-rewrite-v1',
      interviewPrepModelName: 'mock-interview-prep-v1',
      analyzeCv,
      matchJobDescription,
      generateCoverLetter,
      rewriteResume,
      refineRewrite,
      generateInterviewPrep,
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
      service.generateInterviewPrep('extracted cv text', {
        interviewFocus: 'mixed',
        jobDescriptionText: 'job description',
      }),
    ).resolves.toEqual({
      aiProvider: 'mock',
      aiModel: 'mock-interview-prep-v1',
      result: {
        focus: 'mixed',
        questions: [
          {
            question: 'Tell me about an API you improved.',
            whyItMatters: 'Tests impact and ownership.',
            suggestedAnswerDirection: 'Use a recent API example with scope.',
            starGuidance: {
              situation: 'Backend system context',
              task: 'Reliability or performance goal',
              action: 'Specific TypeScript and NestJS work',
              result: 'Measured outcome',
            },
          },
        ],
        weakPointFocusAreas: ['Quantify API outcomes'],
      },
    });
    expect(generateInterviewPrep).toHaveBeenCalledWith('extracted cv text', {
      interviewFocus: 'mixed',
      jobDescriptionText: 'job description',
    });
  });
});
