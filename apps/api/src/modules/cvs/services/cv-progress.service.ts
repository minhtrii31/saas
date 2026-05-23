import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { cvNotFound } from '../cvs.errors';
import {
  cvProgressAnalysisSelect,
  type CvImprovementDeltas,
  type CvProgress,
  type CvProgressAnalysisItem,
  type CvProgressPoint,
  type CvRewriteActivityPoint,
  type CvScoringCategoryTrendPoint,
} from '../cvs.types';
import { CvRecordsService } from './cv-records.service';

const scoringCategoryKeys = [
  'atsReadiness',
  'readability',
  'impact',
  'keywordOptimization',
  'structure',
  'experienceQuality',
] as const;

type ScoringCategoryKey = (typeof scoringCategoryKeys)[number];

type ScoringCategories = Record<ScoringCategoryKey, number | null>;

@Injectable()
export class CvProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvRecordsService: CvRecordsService,
  ) {}

  async getProgress(userId: string, cvId: string): Promise<CvProgress> {
    const cv = await this.cvRecordsService.findOwnedId(userId, cvId);

    if (!cv) {
      throw cvNotFound();
    }

    const analyses = await this.prisma.cvAnalysis.findMany({
      where: {
        cvId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: cvProgressAnalysisSelect,
    });

    return this.aggregateProgress(cvId, analyses);
  }

  aggregateProgress(
    cvId: string,
    analyses: CvProgressAnalysisItem[],
  ): CvProgress {
    const scoreTimeline = this.getScoreHistory(analyses);
    const scoringCategoryTrends = this.getScoringCategoryTrends(analyses);
    const atsTrend = this.getAtsTrend(scoringCategoryTrends);
    const rewriteActivityTrend = this.getRewriteActivityTrend(analyses);
    const improvementDeltas = this.getImprovementDeltas(
      scoreTimeline,
      scoringCategoryTrends,
    );
    const latestScore = scoreTimeline.at(-1)?.score ?? null;
    const earliestScore = scoreTimeline[0]?.score ?? null;
    const totalRewriteActions = rewriteActivityTrend.reduce(
      (sum, point) => sum + point.total,
      0,
    );
    const rewritesThisWeek = this.countRewritesThisWeek(analyses);

    return {
      cvId,
      scoreTimeline,
      atsTrend,
      scoringCategoryTrends,
      rewriteActivityTrend,
      improvementDeltas,
      summary: {
        earliestScore,
        latestScore,
        latestScoreVsEarliestScore: this.delta(latestScore, earliestScore),
        totalScoreAnalyses: scoreTimeline.length,
        totalRewriteActions,
        rewritesThisWeek,
        insights: this.buildInsights({
          improvementDeltas,
          totalRewriteActions,
          rewritesThisWeek,
        }),
      },
    };
  }

  getScoreHistory(analyses: CvProgressAnalysisItem[]): CvProgressPoint[] {
    return analyses
      .filter((analysis) => analysis.type === 'CV_ANALYSIS')
      .map((analysis) => ({
        analysisId: analysis.id,
        createdAt: analysis.createdAt,
        score: this.readNumber(analysis.result, 'score'),
      }))
      .filter((point) => point.score !== null) as CvProgressPoint[];
  }

  getAtsTrend(
    categoryTrends: CvScoringCategoryTrendPoint[],
  ): CvProgressPoint[] {
    return categoryTrends
      .map((point) => ({
        analysisId: point.analysisId,
        createdAt: point.createdAt,
        score: point.categories.atsReadiness,
      }))
      .filter((point) => point.score !== null) as CvProgressPoint[];
  }

  getScoringCategoryTrends(
    analyses: CvProgressAnalysisItem[],
  ): CvScoringCategoryTrendPoint[] {
    return analyses
      .filter((analysis) => analysis.type === 'CV_ANALYSIS')
      .map((analysis) => ({
        analysisId: analysis.id,
        createdAt: analysis.createdAt,
        categories: this.readScoringCategories(analysis.result),
      }))
      .filter((point) =>
        Object.values(point.categories).some((value) => value !== null),
      );
  }

  getRewriteActivityTrend(
    analyses: CvProgressAnalysisItem[],
  ): CvRewriteActivityPoint[] {
    const activityByDate = new Map<string, CvRewriteActivityPoint>();

    for (const analysis of analyses) {
      if (
        analysis.type !== 'RESUME_REWRITE' &&
        analysis.type !== 'REWRITE_REFINEMENT'
      ) {
        continue;
      }

      const date = analysis.createdAt.toISOString().slice(0, 10);
      const existing =
        activityByDate.get(date) ??
        ({
          date,
          total: 0,
          resumeRewrite: 0,
          rewriteRefinement: 0,
        } satisfies CvRewriteActivityPoint);

      existing.total += 1;
      if (analysis.type === 'RESUME_REWRITE') {
        existing.resumeRewrite += 1;
      } else {
        existing.rewriteRefinement += 1;
      }

      activityByDate.set(date, existing);
    }

    return [...activityByDate.values()].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
  }

  getImprovementDeltas(
    scoreTimeline: CvProgressPoint[],
    categoryTrends: CvScoringCategoryTrendPoint[],
  ): CvImprovementDeltas {
    const earliestCategories = categoryTrends[0]?.categories;
    const latestCategories = categoryTrends.at(-1)?.categories;

    return {
      score: this.delta(scoreTimeline.at(-1)?.score, scoreTimeline[0]?.score),
      atsReadiness: this.delta(
        latestCategories?.atsReadiness,
        earliestCategories?.atsReadiness,
      ),
      keywordOptimization: this.delta(
        latestCategories?.keywordOptimization,
        earliestCategories?.keywordOptimization,
      ),
      impact: this.delta(latestCategories?.impact, earliestCategories?.impact),
    };
  }

  private buildInsights({
    improvementDeltas,
    totalRewriteActions,
    rewritesThisWeek,
  }: {
    improvementDeltas: CvImprovementDeltas;
    totalRewriteActions: number;
    rewritesThisWeek: number;
  }) {
    const insights: string[] = [];

    if (improvementDeltas.atsReadiness !== null) {
      insights.push(
        this.formatDeltaInsight(
          'ATS readiness',
          improvementDeltas.atsReadiness,
        ),
      );
    }

    if (improvementDeltas.keywordOptimization !== null) {
      insights.push(
        this.formatDeltaInsight(
          'Keyword optimization',
          improvementDeltas.keywordOptimization,
        ),
      );
    }

    if (rewritesThisWeek > 0) {
      insights.push(
        `${rewritesThisWeek} ${rewritesThisWeek === 1 ? 'rewrite' : 'rewrites'} generated this week`,
      );
    } else if (totalRewriteActions > 0) {
      insights.push(
        `${totalRewriteActions} total ${totalRewriteActions === 1 ? 'rewrite' : 'rewrites'} generated`,
      );
    }

    return insights;
  }

  private readScoringCategories(result: unknown): ScoringCategories {
    const categories = this.readObject(result)?.scoringCategories;
    const output = {} as ScoringCategories;

    for (const key of scoringCategoryKeys) {
      output[key] = this.readNumber(categories, key);
    }

    return output;
  }

  private countRewritesThisWeek(analyses: CvProgressAnalysisItem[]) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setUTCHours(0, 0, 0, 0);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());

    return analyses.filter(
      (analysis) =>
        (analysis.type === 'RESUME_REWRITE' ||
          analysis.type === 'REWRITE_REFINEMENT') &&
        analysis.createdAt >= weekStart,
    ).length;
  }

  private readNumber(result: unknown, key: string): number | null {
    const value = this.readObject(result)?.[key];

    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private readObject(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : null;
  }

  private delta(
    latest: number | null | undefined,
    earliest: number | null | undefined,
  ) {
    if (latest === null || latest === undefined) {
      return null;
    }

    if (earliest === null || earliest === undefined) {
      return null;
    }

    return latest - earliest;
  }

  private formatSignedNumber(value: number) {
    return value > 0 ? `+${value}` : String(value);
  }

  private formatDeltaInsight(label: string, value: number) {
    if (value > 0) {
      return `${label} improved ${this.formatSignedNumber(value)}`;
    }

    if (value < 0) {
      return `${label} changed ${this.formatSignedNumber(value)}`;
    }

    return `${label} held steady`;
  }
}
