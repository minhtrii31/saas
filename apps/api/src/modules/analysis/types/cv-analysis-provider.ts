export type CvAnalysisResult = {
  score: number;
  strengths: string[];
  weaknesses: string[];
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

export type AnalysisProviderResponse<TResult> = {
  aiProvider: string;
  aiModel: string;
  result: TResult;
};

export type CvAnalysisResponse = AnalysisProviderResponse<CvAnalysisResult>;
export type JdMatchResponse = AnalysisProviderResponse<JdMatchResult>;
export type CoverLetterResponse = AnalysisProviderResponse<CoverLetterResult>;

export interface CvAnalysisProvider {
  readonly providerName: string;
  readonly modelName: string;
  readonly jdMatcherModelName: string;
  readonly coverLetterModelName: string;
  analyzeCv(extractedText: string): Promise<CvAnalysisResult>;
  matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResult>;
  generateCoverLetter(
    extractedText: string,
    input: CoverLetterGenerationInput,
  ): Promise<CoverLetterResult>;
}
