"use client";

import { ApiClientError, apiClient } from "@/lib/api";
import type {
  AuthUser,
  CoverLetterResult,
  CvAnalysis,
  CvAnalysisResult,
  CvItem,
  JdMatchResult,
  RewriteRefinementInstruction,
  RewriteRefinementResult,
  ResumeRewriteGoal,
  ResumeRewriteResult,
} from "@/lib/api";

type SingleResumeRewriteResult = {
  originalText?: unknown;
  rewrittenText?: unknown;
  explanation?: unknown;
  rewriteGoal?: unknown;
};

export async function validateSession(token: string) {
  const response = await apiClient.request<AuthUser>("/auth/me", {
    method: "GET",
    headers: authHeaders(token),
  });

  return response.data;
}

export async function fetchCvs(token: string) {
  const response = await apiClient.request<CvItem[]>("/cvs", {
    method: "GET",
    headers: authHeaders(token),
  });

  return response.data;
}

export async function fetchCv(token: string, cvId: string) {
  const response = await apiClient.request<CvItem>(`/cvs/${cvId}`, {
    method: "GET",
    headers: authHeaders(token),
  });

  return response.data;
}

export async function fetchCvAnalyses(token: string, cvId: string) {
  const response = await apiClient.request<CvAnalysis[]>(
    `/cvs/${cvId}/analyses`,
    {
      method: "GET",
      headers: authHeaders(token),
    },
  );

  return response.data;
}

export async function uploadCv(token: string, formData: FormData) {
  const response = await apiClient.request<CvItem>("/cvs/upload", {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  return response.data;
}

export async function analyzeCv(token: string, cvId: string) {
  const response = await apiClient.request<CvAnalysis>(`/cvs/${cvId}/analyze`, {
    method: "POST",
    headers: authHeaders(token),
  });

  return toCvAnalysisResult(response.data.result);
}

export async function matchCv(
  token: string,
  cvId: string,
  jobDescriptionText: string,
) {
  const response = await apiClient.request<CvAnalysis>(`/cvs/${cvId}/match`, {
    method: "POST",
    headers: authHeaders(token),
    body: {
      jobDescriptionText,
    },
  });

  return toJdMatchResult(response.data.result);
}

export async function generateCoverLetter(
  token: string,
  cvId: string,
  input: {
    jobDescriptionText: string;
    companyName?: string;
    roleTitle?: string;
    tone?: string;
  },
) {
  const response = await apiClient.request<CvAnalysis>(
    `/cvs/${cvId}/cover-letter`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: input,
    },
  );

  return toCoverLetterResult(response.data.result);
}

export async function rewriteResume(
  token: string,
  cvId: string,
  goal: ResumeRewriteGoal,
  originalText: string,
) {
  const response = await apiClient.request<CvAnalysis>(`/cvs/${cvId}/rewrite`, {
    method: "POST",
    headers: authHeaders(token),
    body: {
      originalText,
      rewriteGoal: goal,
    },
  });

  return toResumeRewriteResult(response.data.result, goal);
}

export async function refineRewrite(
  token: string,
  cvId: string,
  input: {
    original: string;
    currentRewrite: string;
    instruction: RewriteRefinementInstruction;
  },
) {
  const response = await apiClient.request<CvAnalysis>(
    `/cvs/${cvId}/rewrite/refine`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: input,
    },
  );

  return toRewriteRefinementResult(response.data.result);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.error.message : fallback;
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}

export function sortAnalysesNewestFirst(analyses: CvAnalysis[]) {
  return [...analyses].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function isJdMatchResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
): result is JdMatchResult {
  return "matchingScore" in result;
}

export function isCoverLetterResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
): result is CoverLetterResult {
  return "coverLetter" in result;
}

export function isResumeRewriteResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult
    | SingleResumeRewriteResult,
): result is ResumeRewriteResult {
  return "suggestions" in result && Array.isArray(result.suggestions)
    ? result.suggestions.every(
        (suggestion) =>
          typeof suggestion === "object" &&
          suggestion !== null &&
          "original" in suggestion &&
          "improved" in suggestion &&
          "reason" in suggestion,
      )
    : false;
}

export function isRewriteRefinementResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
): result is RewriteRefinementResult {
  return "improved" in result && "reason" in result;
}

export function hasSuggestions(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
): result is CvAnalysisResult | JdMatchResult {
  return (
    "suggestions" in result &&
    !isResumeRewriteResult(result) &&
    !isRewriteRefinementResult(result)
  );
}

function toCvAnalysisResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
) {
  if (
    !isJdMatchResult(result) &&
    !isCoverLetterResult(result) &&
    !isResumeRewriteResult(result) &&
    !isRewriteRefinementResult(result)
  ) {
    return result;
  }

  return {
    score: isJdMatchResult(result) ? result.matchingScore : 0,
    suggestions: hasSuggestions(result) ? result.suggestions : undefined,
  };
}

function toJdMatchResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
) {
  if (isJdMatchResult(result)) {
    return result;
  }

  return {
    matchingScore:
      isCoverLetterResult(result) ||
      isResumeRewriteResult(result) ||
      isRewriteRefinementResult(result)
        ? 0
        : result.score,
    suggestions: hasSuggestions(result) ? result.suggestions : undefined,
  };
}

function toCoverLetterResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
) {
  if (isCoverLetterResult(result)) {
    return result;
  }

  return {
    coverLetter: "",
    tone: "Not provided",
    highlights: [],
  };
}

function toResumeRewriteResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult
    | SingleResumeRewriteResult,
  goal: ResumeRewriteGoal,
) {
  if (isResumeRewriteResult(result)) {
    return result;
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "originalText" in result &&
    "rewrittenText" in result &&
    "explanation" in result
  ) {
    const original = String(result.originalText || "");
    const improved = String(result.rewrittenText || "");
    const reason = String(result.explanation || "");

    return {
      goal,
      suggestions:
        original && improved && reason
          ? [
              {
                original,
                improved,
                reason,
              },
            ]
          : [],
    };
  }

  return {
    goal,
    suggestions: [],
  };
}

function toRewriteRefinementResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult
    | RewriteRefinementResult,
) {
  if (isRewriteRefinementResult(result)) {
    return result;
  }

  return {
    improved: "",
    reason: "",
  };
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
