import { CvProgressService } from '../services/cv-progress.service';

describe('CvProgressService', () => {
  const prisma = {
    cvAnalysis: {
      findMany: jest.fn(),
    },
  };
  const cvRecordsService = {
    findOwnedId: jest.fn(),
  };
  const service = new CvProgressService(
    prisma as never,
    cvRecordsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates score history, ATS trend, rewrite activity, and improvement deltas', () => {
    const progress = service.aggregateProgress('cv-1', [
      {
        id: 'analysis-1',
        type: 'CV_ANALYSIS',
        result: {
          score: 68,
          scoringCategories: {
            atsReadiness: 61,
            readability: 70,
            impact: 55,
            keywordOptimization: 58,
            structure: 72,
            experienceQuality: 66,
          },
        },
        createdAt: new Date('2026-05-18T10:00:00.000Z'),
      },
      {
        id: 'rewrite-1',
        type: 'RESUME_REWRITE',
        result: {},
        createdAt: new Date('2026-05-20T10:00:00.000Z'),
      },
      {
        id: 'refine-1',
        type: 'REWRITE_REFINEMENT',
        result: {},
        createdAt: new Date('2026-05-20T11:00:00.000Z'),
      },
      {
        id: 'analysis-2',
        type: 'CV_ANALYSIS',
        result: {
          score: 82,
          scoringCategories: {
            atsReadiness: 73,
            readability: 78,
            impact: 68,
            keywordOptimization: 76,
            structure: 82,
            experienceQuality: 80,
          },
        },
        createdAt: new Date('2026-05-22T10:00:00.000Z'),
      },
    ]);

    expect(progress.scoreTimeline).toEqual([
      {
        analysisId: 'analysis-1',
        createdAt: new Date('2026-05-18T10:00:00.000Z'),
        score: 68,
      },
      {
        analysisId: 'analysis-2',
        createdAt: new Date('2026-05-22T10:00:00.000Z'),
        score: 82,
      },
    ]);
    expect(progress.atsTrend).toEqual([
      {
        analysisId: 'analysis-1',
        createdAt: new Date('2026-05-18T10:00:00.000Z'),
        score: 61,
      },
      {
        analysisId: 'analysis-2',
        createdAt: new Date('2026-05-22T10:00:00.000Z'),
        score: 73,
      },
    ]);
    expect(progress.rewriteActivityTrend).toEqual([
      {
        date: '2026-05-20',
        total: 2,
        resumeRewrite: 1,
        rewriteRefinement: 1,
      },
    ]);
    expect(progress.improvementDeltas).toEqual({
      score: 14,
      atsReadiness: 12,
      keywordOptimization: 18,
      impact: 13,
    });
    expect(progress.summary).toEqual(
      expect.objectContaining({
        earliestScore: 68,
        latestScore: 82,
        latestScoreVsEarliestScore: 14,
        totalScoreAnalyses: 2,
        totalRewriteActions: 2,
      }),
    );
    expect(progress.summary.insights).toContain('ATS readiness improved +12');
    expect(progress.summary.insights).toContain(
      'Keyword optimization improved +18',
    );
  });

  it('returns empty trends and null deltas when history has no score records', () => {
    const progress = service.aggregateProgress('cv-1', []);

    expect(progress).toEqual({
      cvId: 'cv-1',
      scoreTimeline: [],
      atsTrend: [],
      scoringCategoryTrends: [],
      rewriteActivityTrend: [],
      improvementDeltas: {
        score: null,
        atsReadiness: null,
        keywordOptimization: null,
        impact: null,
      },
      summary: {
        earliestScore: null,
        latestScore: null,
        latestScoreVsEarliestScore: null,
        totalScoreAnalyses: 0,
        totalRewriteActions: 0,
        rewritesThisWeek: 0,
        insights: [],
      },
    });
  });
});
