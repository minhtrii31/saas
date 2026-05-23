"use client";

import type { CvAnalysis } from "@/lib/api";

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatAnalysisType(type: CvAnalysis["type"]) {
  if (type === "COVER_LETTER") {
    return "Cover letter";
  }

  if (type === "JD_MATCH") {
    return "JD match";
  }

  if (type === "RESUME_REWRITE") {
    return "Resume rewrite";
  }

  if (type === "REWRITE_REFINEMENT") {
    return "Rewrite refinement";
  }

  if (type === "INTERVIEW_PREP") {
    return "Interview prep";
  }

  return "CV analysis";
}
