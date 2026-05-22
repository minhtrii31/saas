"use client";

import type { JdMatchResult } from "@/lib/api";

import { AnalysisList } from "../analysis/analysis-list";

export function MatchResult({
  result,
  cvTitle,
}: {
  result: JdMatchResult;
  cvTitle: string;
}) {
  return (
    <section
      aria-label={`JD match result for ${cvTitle}`}
      className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-950">JD match result</h2>
      <p className="mt-3 text-sm text-zinc-700">
        Matching score:{" "}
        <span className="font-semibold text-zinc-950">
          {result.matchingScore}
        </span>
      </p>
      <AnalysisList title="Matched skills" items={result.matchedSkills} />
      <AnalysisList title="Missing skills" items={result.missingSkills} />
      <AnalysisList title="Suggestions" items={result.suggestions} />
    </section>
  );
}
