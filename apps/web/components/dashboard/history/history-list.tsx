"use client";

import { FilePenLine, FileText, GitCompare } from "lucide-react";

import type { CvAnalysis, CvAnalysisResult, CvItem } from "@/lib/api";

import {
  hasSuggestions,
  isCoverLetterResult,
  isJdMatchResult,
  isResumeRewriteResult,
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
              {isResumeRewriteResult(analysis.result) ? (
                <>
                  <p className="mt-3 inline-flex border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-sm text-[#5f5f58]">
                    Rewrite goal:{" "}
                    <span className="font-semibold text-[#171717]">
                      {formatRewriteGoal(analysis.result.goal)}
                    </span>
                  </p>
                  <div className="mt-4 space-y-3">
                    {analysis.result.suggestions.map((suggestion, index) => (
                      <div
                        key={`${analysis.id}-${index}`}
                        className="border border-[#e5e5df] bg-[#fafaf8] p-3"
                      >
                        <div className="grid gap-3 lg:grid-cols-2">
                          <HistoryRewriteText
                            label="Original"
                            text={suggestion.original}
                          />
                          <HistoryRewriteText
                            label="Improved"
                            text={suggestion.improved}
                            strong
                          />
                        </div>
                        <p className="mt-3 border-t border-[#e5e5df] pt-3 text-sm leading-6 text-[#343430]">
                          <span className="font-semibold text-[#171717]">
                            Reason:{" "}
                          </span>
                          {suggestion.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : isCoverLetterResult(analysis.result) ? (
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
                  <ScoreCategorySummary result={analysis.result} />
                  <ActionableInsightSummary result={analysis.result} />
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

const scoringCategoryLabels: Array<{
  key: keyof NonNullable<CvAnalysisResult["scoringCategories"]>;
  label: string;
}> = [
  { key: "atsReadiness", label: "ATS" },
  { key: "readability", label: "Readability" },
  { key: "impact", label: "Impact" },
  { key: "keywordOptimization", label: "Keywords" },
  { key: "structure", label: "Structure" },
  { key: "experienceQuality", label: "Experience" },
];

const actionableInsightLabels: Array<{
  key: keyof NonNullable<CvAnalysisResult["actionableInsights"]>;
  label: string;
}> = [
  { key: "missingQuantifiedAchievements", label: "Missing metrics" },
  { key: "weakActionVerbs", label: "Weak verbs" },
  { key: "missingSections", label: "Missing sections" },
  { key: "overlyGenericWording", label: "Generic wording" },
  { key: "formattingConcerns", label: "Formatting" },
  { key: "keywordGaps", label: "Keyword gaps" },
];

function ScoreCategorySummary({ result }: { result: CvAnalysisResult }) {
  const categories = scoringCategoryLabels.flatMap(({ key, label }) => {
    const value = result.scoringCategories?.[key];

    return typeof value === "number" ? [{ key, label, value }] : [];
  });

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        Scorecard
      </h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.key}
            className="flex items-center justify-between gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-sm"
          >
            <span className="min-w-0 text-[#5f5f58] [overflow-wrap:anywhere]">
              {category.label}
            </span>
            <span className="font-mono font-semibold text-[#171717]">
              {category.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionableInsightSummary({ result }: { result: CvAnalysisResult }) {
  const groups = actionableInsightLabels
    .map(({ key, label }) => ({ key, label, items: result.actionableInsights?.[key] }))
    .filter(({ items }) => Boolean(items?.length));

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        Actionable insights
      </h3>
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.key} className="border border-[#e5e5df] bg-white p-3">
            <p className="text-xs font-semibold text-[#171717]">
              {group.label}
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-[#343430]">
              {group.items?.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a1a19a]"
                  />
                  <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisTypeIcon({ type }: { type: CvAnalysis["type"] }) {
  const Icon =
    type === "JD_MATCH" || type === "RESUME_REWRITE"
      ? GitCompare
      : type === "COVER_LETTER"
        ? FilePenLine
        : FileText;

  return (
    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-[#d8d8d1] bg-[#f1f1ee] text-[#343430]">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function HistoryRewriteText({
  label,
  text,
  strong = false,
}: {
  label: string;
  text: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-6 [overflow-wrap:anywhere] ${
          strong ? "font-medium text-[#171717]" : "text-[#5f5f58]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function formatRewriteGoal(goal: string) {
  return goal
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
