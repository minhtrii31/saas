"use client";

import type { CvAnalysisResult } from "@/lib/api";

import { AnalysisList } from "./analysis-list";

export function AnalysisResult({
  result,
  cvTitle,
}: {
  result: CvAnalysisResult;
  cvTitle: string;
}) {
  return (
    <section
      aria-label={`Analysis result for ${cvTitle}`}
      className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-950">Analysis result</h2>
      <p className="mt-3 text-sm text-zinc-700">
        Score: <span className="font-semibold text-zinc-950">{result.score}</span>
      </p>
      <AnalysisList title="Strengths" items={result.strengths} />
      <AnalysisList title="Weaknesses" items={result.weaknesses} />
      <AnalysisList title="Suggestions" items={result.suggestions} />
    </section>
  );
}
