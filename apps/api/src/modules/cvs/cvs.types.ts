import type {
  CoverLetterResult,
  CvAnalysisResult,
  JdMatchResult,
  RewriteRefinementResult,
  ResumeRewriteResult,
} from '../analysis/types/cv-analysis-provider';

export type CreatedCv = {
  id: string;
  title: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  storageUrl: string | null;
  extractedText: string | null;
  createdAt: Date;
};

export type CvListItem = CreatedCv;
export type CvDetail = CreatedCv;

export type DeletedCv = {
  id: string;
  deletedAt: Date | null;
};

export type OwnedCvText = {
  id: string;
  extractedText: string | null;
};

export type CreatedCvAnalysis = {
  id: string;
  cvId: string;
  type: string;
  aiProvider: string | null;
  aiModel: string | null;
  result: CvAnalysisResult;
  createdAt: Date;
};

export type CreatedJdMatchAnalysis = {
  id: string;
  cvId: string;
  type: string;
  jobDescriptionText: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  result: JdMatchResult;
  createdAt: Date;
};

export type CreatedCoverLetterAnalysis = {
  id: string;
  cvId: string;
  type: string;
  jobDescriptionText: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  result: CoverLetterResult;
  createdAt: Date;
};

export type CreatedResumeRewriteAnalysis = {
  id: string;
  cvId: string;
  type: string;
  aiProvider: string | null;
  aiModel: string | null;
  result: ResumeRewriteResult;
  createdAt: Date;
};

export type CreatedRewriteRefinementAnalysis = {
  id: string;
  cvId: string;
  type: string;
  aiProvider: string | null;
  aiModel: string | null;
  result: RewriteRefinementResult;
  createdAt: Date;
};

export type CvAnalysisHistoryItem = {
  id: string;
  cvId: string;
  type: string;
  jobDescriptionText: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  result: unknown;
  createdAt: Date;
};

export type CvProgressAnalysisItem = Pick<
  CvAnalysisHistoryItem,
  'id' | 'type' | 'result' | 'createdAt'
>;

export type CvProgressPoint = {
  analysisId: string;
  createdAt: Date;
  score: number;
};

export type CvScoringCategoryTrendPoint = {
  analysisId: string;
  createdAt: Date;
  categories: {
    atsReadiness: number | null;
    readability: number | null;
    impact: number | null;
    keywordOptimization: number | null;
    structure: number | null;
    experienceQuality: number | null;
  };
};

export type CvRewriteActivityPoint = {
  date: string;
  total: number;
  resumeRewrite: number;
  rewriteRefinement: number;
};

export type CvImprovementDeltas = {
  score: number | null;
  atsReadiness: number | null;
  keywordOptimization: number | null;
  impact: number | null;
};

export type CvProgressSummary = {
  earliestScore: number | null;
  latestScore: number | null;
  latestScoreVsEarliestScore: number | null;
  totalScoreAnalyses: number;
  totalRewriteActions: number;
  rewritesThisWeek: number;
  insights: string[];
};

export type CvProgress = {
  cvId: string;
  scoreTimeline: CvProgressPoint[];
  atsTrend: CvProgressPoint[];
  scoringCategoryTrends: CvScoringCategoryTrendPoint[];
  rewriteActivityTrend: CvRewriteActivityPoint[];
  improvementDeltas: CvImprovementDeltas;
  summary: CvProgressSummary;
};

export const cvSelect = {
  id: true,
  title: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  storageProvider: true,
  storageKey: true,
  storageUrl: true,
  extractedText: true,
  createdAt: true,
};

export const cvAnalysisSelect = {
  id: true,
  cvId: true,
  type: true,
  aiProvider: true,
  aiModel: true,
  result: true,
  createdAt: true,
};

export const jdMatchAnalysisSelect = {
  id: true,
  cvId: true,
  type: true,
  jobDescriptionText: true,
  aiProvider: true,
  aiModel: true,
  result: true,
  createdAt: true,
};

export const cvAnalysisHistorySelect = {
  id: true,
  cvId: true,
  type: true,
  jobDescriptionText: true,
  aiProvider: true,
  aiModel: true,
  result: true,
  createdAt: true,
};

export const cvProgressAnalysisSelect = {
  id: true,
  type: true,
  result: true,
  createdAt: true,
};
