"use client";

import { FilePenLine, FileText, GitCompare } from "lucide-react";

import type { CvAnalysis, CvItem } from "@/lib/api";

import {
  hasSuggestions,
  isCoverLetterResult,
  isJdMatchResult,
} from "../api";
import { AnalysisList } from "../analysis/analysis-list";
import { formatAnalysisType, formatDateTime } from "../format";
import { EmptyState } from "../result-ui";

export function HistoryList({
  analyses,
  cvsById,
}: {
  analyses: CvAnalysis[];
  cvsById: Map<string, CvItem>;
}) {
  if (analyses.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nothing saved yet"
        description="No analysis history yet. Run an analysis to create one. Saved matches and cover letter drafts will appear here too."
      />
    );
  }

  return (
    <section
      aria-label="Analysis history"
      className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02]"
    >
      <ul className="relative space-y-4 before:absolute before:bottom-5 before:left-4 before:top-5 before:w-px before:bg-[#e5e5df]">
        {analyses.map((analysis) => {
          const cv = cvsById.get(analysis.cvId);

          return (
            <li
              key={analysis.id}
              className="relative grid gap-4 border border-[#e5e5df] bg-white p-4 transition hover:border-[#cfcfc8] hover:bg-[#fafaf8] lg:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <div className="flex gap-3">
                <AnalysisTypeIcon type={analysis.type} />
                <div className="min-w-0">
                  <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a19a]">
                    {analysis.type.replace("_", " ")}
                  </p>
                  <p className="inline-flex border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-xs font-semibold text-[#171717]">
                    {formatAnalysisType(analysis.type)}
                  </p>
                  <p className="mt-1 text-xs text-[#6f6f68]">
                  {formatDateTime(analysis.createdAt)}
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
                  {cv?.title || cv?.originalName || analysis.cvId}
                </p>
              {isCoverLetterResult(analysis.result) ? (
                <>
                  <p className="mt-3 line-clamp-4 border-l border-[#d8d8d1] pl-4 whitespace-pre-wrap text-sm leading-6 text-[#343430]">
                    {analysis.result.coverLetter}
                  </p>
                  <p className="mt-3 text-sm text-[#5f5f58]">
                    Tone:{" "}
                    <span className="font-semibold text-[#171717]">
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
                  <p className="mt-3 inline-flex border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-sm text-[#5f5f58]">
                    Matching score:{" "}
                    <span className="font-semibold text-[#171717]">
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
                  <p className="mt-3 inline-flex border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-sm text-[#5f5f58]">
                    Score:{" "}
                    <span className="font-semibold text-[#171717]">
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
                <div className="mt-4 border-t border-[#e5e5df] pt-1">
                  <AnalysisList
                    title="Suggestions"
                    items={analysis.result.suggestions}
                  />
                </div>
              ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AnalysisTypeIcon({ type }: { type: CvAnalysis["type"] }) {
  const Icon =
    type === "JD_MATCH" ? GitCompare : type === "COVER_LETTER" ? FilePenLine : FileText;

  return (
    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-[#d8d8d1] bg-[#f1f1ee] text-[#343430]">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}
