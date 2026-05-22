"use client";

import type { CvAnalysis, CvItem } from "@/lib/api";

import {
  hasSuggestions,
  isCoverLetterResult,
  isJdMatchResult,
} from "../api";
import { AnalysisList } from "../analysis/analysis-list";
import { formatAnalysisType, formatDateTime } from "../format";

export function HistoryList({
  analyses,
  cvsById,
}: {
  analyses: CvAnalysis[];
  cvsById: Map<string, CvItem>;
}) {
  if (analyses.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        No analysis history yet. Run an analysis to create one.
      </div>
    );
  }

  return (
    <section
      aria-label="Analysis history"
      className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <ul className="space-y-4">
        {analyses.map((analysis) => {
          const cv = cvsById.get(analysis.cvId);

          return (
            <li
              key={analysis.id}
              className="rounded-md border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    {formatAnalysisType(analysis.type)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {cv?.title || cv?.originalName || analysis.cvId}
                  </p>
                </div>
                <p className="text-sm text-zinc-500">
                  {formatDateTime(analysis.createdAt)}
                </p>
              </div>

              {isCoverLetterResult(analysis.result) ? (
                <>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                    {analysis.result.coverLetter}
                  </p>
                  <p className="mt-3 text-sm text-zinc-700">
                    Tone:{" "}
                    <span className="font-semibold text-zinc-950">
                      {analysis.result.tone}
                    </span>
                  </p>
                  <AnalysisList
                    title="Highlights"
                    items={analysis.result.highlights}
                  />
                </>
              ) : isJdMatchResult(analysis.result) ? (
                <>
                  <p className="mt-3 text-sm text-zinc-700">
                    Matching score:{" "}
                    <span className="font-semibold text-zinc-950">
                      {analysis.result.matchingScore}
                    </span>
                  </p>
                  <AnalysisList
                    title="Matched skills"
                    items={analysis.result.matchedSkills}
                  />
                  <AnalysisList
                    title="Missing skills"
                    items={analysis.result.missingSkills}
                  />
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-zinc-700">
                    Score:{" "}
                    <span className="font-semibold text-zinc-950">
                      {analysis.result.score}
                    </span>
                  </p>
                  <AnalysisList
                    title="Strengths"
                    items={analysis.result.strengths}
                  />
                  <AnalysisList
                    title="Weaknesses"
                    items={analysis.result.weaknesses}
                  />
                </>
              )}

              {hasSuggestions(analysis.result) ? (
                <AnalysisList
                  title="Suggestions"
                  items={analysis.result.suggestions}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
