export type CvAnalysisResult = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

export type CvAnalysisResponse = {
  aiProvider: string;
  aiModel: string;
  result: CvAnalysisResult;
};

export interface CvAnalysisProvider {
  readonly providerName: string;
  readonly modelName: string;
  analyzeCv(extractedText: string): Promise<CvAnalysisResult>;
}
