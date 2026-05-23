"use client";

import { ApiClientError, apiClient } from "@/lib/api";
import type {
  AuthUser,
  CoverLetterResult,
  CvAnalysis,
  CvAnalysisResult,
  CvItem,
  JdMatchResult,
  ResumeRewriteGoal,
  ResumeRewriteResult,
} from "@/lib/api";

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
) {
  const response = await apiClient.request<CvAnalysis>(`/cvs/${cvId}/rewrite`, {
    method: "POST",
    headers: authHeaders(token),
    body: {
      goal,
    },
  });

  return toResumeRewriteResult(response.data.result, goal);
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
    | ResumeRewriteResult,
): result is JdMatchResult {
  return "matchingScore" in result;
}

export function isCoverLetterResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult,
): result is CoverLetterResult {
  return "coverLetter" in result;
}

export function isResumeRewriteResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult,
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

export function hasSuggestions(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult,
): result is CvAnalysisResult | JdMatchResult {
  return "suggestions" in result && !isResumeRewriteResult(result);
}

function toCvAnalysisResult(
  result:
    | CvAnalysisResult
    | JdMatchResult
    | CoverLetterResult
    | ResumeRewriteResult,
) {
  if (
    !isJdMatchResult(result) &&
    !isCoverLetterResult(result) &&
    !isResumeRewriteResult(result)
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
    | ResumeRewriteResult,
) {
  if (isJdMatchResult(result)) {
    return result;
  }

  return {
    matchingScore:
      isCoverLetterResult(result) || isResumeRewriteResult(result)
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
    | ResumeRewriteResult,
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
    | ResumeRewriteResult,
  goal: ResumeRewriteGoal,
) {
  if (isResumeRewriteResult(result)) {
    return result;
  }

  return {
    goal,
    suggestions: [],
  };
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
