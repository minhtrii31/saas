export type ApiMeta = Record<string, unknown>;

export type ApiSuccessEnvelope<
  Data,
  Meta extends ApiMeta = ApiMeta,
> = {
  data: Data;
  meta: Meta;
};

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiErrorEnvelope<Meta extends ApiMeta = ApiMeta> = {
  error: ApiError;
  meta: Meta;
};

export type ApiEnvelope<Data, Meta extends ApiMeta = ApiMeta> =
  | ApiSuccessEnvelope<Data, Meta>
  | ApiErrorEnvelope<Meta>;

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  creditBalance?: number;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type CvItem = {
  id: string;
  title?: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  storageUrl?: string | null;
  extractedText?: string | null;
  createdAt: string;
};

export type JobTargetItem = {
  id: string;
  userId: string;
  title: string;
  companyName: string;
  jobDescriptionText: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobTargetRequest = {
  title: string;
  companyName: string;
  jobDescriptionText: string;
};

export type UpdateJobTargetRequest = Partial<CreateJobTargetRequest>;

export type CvAnalysisResult = {
  score: number;
  scoringCategories?: {
    atsReadiness?: number;
    readability?: number;
    impact?: number;
    keywordOptimization?: number;
    structure?: number;
    experienceQuality?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  actionableInsights?: {
    missingQuantifiedAchievements?: string[];
    weakActionVerbs?: string[];
    missingSections?: string[];
    overlyGenericWording?: string[];
    formattingConcerns?: string[];
    keywordGaps?: string[];
  };
  suggestions?: string[];
};

export type JdMatchResult = {
  matchingScore: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  suggestions?: string[];
};

export type CoverLetterResult = {
  coverLetter: string;
  tone: string;
  highlights?: string[];
};

export type ResumeRewriteSuggestion = {
  original: string;
  improved: string;
  reason: string;
};

export type ResumeRewriteGoal =
  | "stronger-impact"
  | "ats-optimization"
  | "concise"
  | "quantified-achievements"
  | "leadership-tone";

export type RewriteRefinementInstruction =
  | "stronger"
  | "shorter"
  | "more-technical"
  | "more-leadership"
  | "more-ats-friendly"
  | "more-results-focused";

export type ResumeRewriteResult = {
  goal: ResumeRewriteGoal;
  suggestions: ResumeRewriteSuggestion[];
};

export type RewriteRefinementResult = {
  improved: string;
  reason: string;
};

export type CvAnalysis = {
  id: string;
  cvId: string;
  type:
    | "CV_ANALYSIS"
    | "JD_MATCH"
    | "COVER_LETTER"
    | "RESUME_REWRITE"
    | "REWRITE_REFINEMENT";
  jobDescriptionText?: string;
  aiProvider: string;
  aiModel: string;
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult;
  createdAt: string;
};

export type CreateCvRequest = {
  title?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageProvider: string;
  storageKey: string;
  storageUrl?: string;
};
