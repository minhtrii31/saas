export type CvScoringCategories = {
  atsReadiness: number;
  readability: number;
  impact: number;
  keywordOptimization: number;
  structure: number;
  experienceQuality: number;
};

export type CvActionableInsights = {
  missingQuantifiedAchievements: string[];
  weakActionVerbs: string[];
  missingSections: string[];
  overlyGenericWording: string[];
  formattingConcerns: string[];
  keywordGaps: string[];
};

export type CvAnalysisResult = {
  score: number;
  scoringCategories: CvScoringCategories;
  strengths: string[];
  weaknesses: string[];
  actionableInsights: CvActionableInsights;
  suggestions: string[];
};

export type JdMatchResult = {
  matchingScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
};

export type CoverLetterGenerationInput = {
  jobDescriptionText: string;
  companyName?: string;
  roleTitle?: string;
  tone?: string;
};

export type CoverLetterResult = {
  coverLetter: string;
  tone: string;
  highlights: string[];
};

export type ResumeRewriteGoal =
  | 'stronger-impact'
  | 'ats-optimization'
  | 'concise'
  | 'quantified-achievements'
  | 'leadership-tone';

export type ResumeRewriteInput = {
  originalText: string;
  rewriteGoal: ResumeRewriteGoal;
};

export type ResumeRewriteResult = {
  originalText: string;
  rewrittenText: string;
  explanation: string;
  rewriteGoal: ResumeRewriteGoal;
};

export type RewriteRefinementInstruction =
  | 'stronger'
  | 'shorter'
  | 'more-technical'
  | 'more-leadership'
  | 'more-ats-friendly'
  | 'more-results-focused';

export type RewriteRefinementInput = {
  original: string;
  currentRewrite: string;
  instruction: RewriteRefinementInstruction;
};

export type RewriteRefinementResult = {
  improved: string;
  reason: string;
};

export type AnalysisProviderResponse<TResult> = {
  aiProvider: string;
  aiModel: string;
  result: TResult;
};

export type CvAnalysisResponse = AnalysisProviderResponse<CvAnalysisResult>;
export type JdMatchResponse = AnalysisProviderResponse<JdMatchResult>;
export type CoverLetterResponse = AnalysisProviderResponse<CoverLetterResult>;
export type ResumeRewriteResponse =
  AnalysisProviderResponse<ResumeRewriteResult>;
export type RewriteRefinementResponse =
  AnalysisProviderResponse<RewriteRefinementResult>;

export interface CvAnalysisProvider {
  readonly providerName: string;
  readonly modelName: string;
  readonly jdMatcherModelName: string;
  readonly coverLetterModelName: string;
  readonly resumeRewriteModelName: string;
  analyzeCv(extractedText: string): Promise<CvAnalysisResult>;
  matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResult>;
  generateCoverLetter(
    extractedText: string,
    input: CoverLetterGenerationInput,
  ): Promise<CoverLetterResult>;
  rewriteResume(
    extractedText: string,
    input: ResumeRewriteInput,
  ): Promise<ResumeRewriteResult>;
  refineRewrite(
    extractedText: string,
    input: RewriteRefinementInput,
  ): Promise<RewriteRefinementResult>;
}
