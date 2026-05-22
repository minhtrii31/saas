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

export type CvAnalysisResult = {
  score: number;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
};

export type CvAnalysis = {
  id: string;
  cvId: string;
  type: "CV_ANALYSIS" | "JD_MATCH";
  aiProvider: string;
  aiModel: string;
  result: CvAnalysisResult;
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
