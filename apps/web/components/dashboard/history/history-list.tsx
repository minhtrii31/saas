"use client";

import { useState } from "react";
import {
  ClipboardList,
  FilePenLine,
  FileText,
  GitCompare,
  MessageSquareText,
  PenLine,
  Sparkles,
} from "lucide-react";

import type { CvAnalysis, CvAnalysisResult, CvItem } from "@/lib/api";

import {
  hasSuggestions,
  isApplicationFollowUpResult,
  isCoverLetterResult,
  isInterviewPrepResult,
  isJdMatchResult,
  isRewriteRefinementResult,
  isResumeRewriteResult,
} from "../api";
import { AnalysisList } from "../analysis/analysis-list";
import { formatDateTime } from "../format";
import { EmptyState } from "../result-ui";

type HistoryGroup = {
  key: string;
  label: string;
  analyses: CvAnalysis[];
};

type ScoreMovement = {
  scoreDelta?: number;
  atsDelta?: number;
  keywordDelta?: number;
};

const defaultVisibleHistoryItems = 5;

export function HistoryList({
  analyses,
  cvsById,
}: {
  analyses: CvAnalysis[];
  cvsById: Map<string, CvItem>;
}) {
  const [showAll, setShowAll] = useState(false);

  if (analyses.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Your timeline is ready when you are"
        description="Your AI activity timeline will appear here after analyses, rewrites, matches, and interview prep sessions."
      />
    );
  }

  const visibleAnalyses = showAll
    ? analyses
    : analyses.slice(0, defaultVisibleHistoryItems);
  const hiddenCount = Math.max(0, analyses.length - visibleAnalyses.length);
  const groups = groupAnalysesByDay(visibleAnalyses);
  const scoreMovements = getScoreMovements(analyses);
  const repeatedKeys = new Set<string>();

  return (
    <section
      aria-label="Career improvement timeline"
      className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02]"
    >
      <div className="flex flex-col gap-2 border-b border-[#e5e5df] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#171717]">
            Career improvement timeline
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#5f5f58]">
            Grouped by day with concise previews first.
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
          Showing {visibleAnalyses.length} of {analyses.length}
        </p>
      </div>

      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <section key={group.key} aria-labelledby={`history-${group.key}`}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[#e5e5df]" />
              <h3
                id={`history-${group.key}`}
                className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-[#6f6f68]"
              >
                {group.label}
              </h3>
              <div className="h-px flex-1 bg-[#e5e5df]" />
            </div>

            <ol className="relative mt-4 space-y-4 before:absolute before:bottom-5 before:left-4 before:top-5 before:w-px before:bg-[#e5e5df]">
              {group.analyses.map((analysis) => {
                const cv = cvsById.get(analysis.cvId);
                const repeatedKey = `${analysis.cvId}:${analysis.type}`;
                const isRepeated = repeatedKeys.has(repeatedKey);
                repeatedKeys.add(repeatedKey);

                return (
                  <HistoryTimelineItem
                    key={analysis.id}
                    analysis={analysis}
                    cv={cv}
                    isRepeated={isRepeated}
                    scoreMovement={scoreMovements.get(analysis.id)}
                  />
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {analyses.length > defaultVisibleHistoryItems ? (
        <div className="mt-5 border-t border-[#e5e5df] pt-4 text-center">
          <button
            type="button"
            className="text-sm font-semibold text-[#343430] hover:text-[#171717]"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll
              ? `Show latest ${defaultVisibleHistoryItems}`
              : `Show older activity (${hiddenCount})`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function HistoryTimelineItem({
  analysis,
  cv,
  isRepeated,
  scoreMovement,
}: {
  analysis: CvAnalysis;
  cv?: CvItem;
  isRepeated: boolean;
  scoreMovement?: ScoreMovement;
}) {
  const identity = getWorkflowIdentity(analysis.type);
  const metric = getPrimaryMetric(analysis);
  const preview = getInsightPreview(analysis);
  const signals = getSignals(analysis, scoreMovement, isRepeated);

  return (
    <li
      data-testid={`history-item-${analysis.id}`}
      className="relative grid gap-3 border border-[#e5e5df] bg-white p-3 transition hover:border-[#cfcfc8] hover:bg-[#fafaf8] lg:grid-cols-[12rem_minmax(0,1fr)]"
    >
      <div className="flex gap-3">
        <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center border border-[#d8d8d1] bg-[#f1f1ee] text-[#343430]">
          <identity.icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a19a]">
            {identity.eyebrow}
          </p>
          <p className="mt-2 inline-flex border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-xs font-semibold text-[#171717]">
            {identity.label}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#6f6f68]">
            {formatDateTime(analysis.createdAt)}
          </p>
        </div>
      </div>

      <article className="min-w-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
              {cv?.title || cv?.originalName || analysis.cvId}
            </h4>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#5f5f58] [overflow-wrap:anywhere]">
              {preview}
            </p>
          </div>
          <p className="shrink-0 border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 font-mono text-xs font-semibold text-[#171717]">
            {metric}
          </p>
        </div>

        {signals.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {signals.map((signal) => (
              <span
                key={signal}
                className="border border-[#e5e5df] bg-[#fafaf8] px-2 py-1 text-xs text-[#5f5f58]"
              >
                {signal}
              </span>
            ))}
          </div>
        ) : null}

        <details className="group mt-4 border-t border-[#e5e5df] pt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#343430] hover:text-[#171717]">
            <span className="border border-[#cfcfc8] bg-white px-3 py-2">
              View full result
            </span>
          </summary>
          <div className="mt-4 border border-[#e5e5df] bg-[#fafaf8] p-4">
            <FullResult analysis={analysis} />
          </div>
        </details>
      </article>
    </li>
  );
}

function FullResult({ analysis }: { analysis: CvAnalysis }) {
  if (isRewriteRefinementResult(analysis.result)) {
    return (
      <div>
        <HistoryRewriteText
          label="Refined rewrite"
          text={analysis.result.improved}
          strong
        />
        <p className="mt-3 border-t border-[#e5e5df] pt-3 text-sm leading-6 text-[#343430]">
          <span className="font-semibold text-[#171717]">Reason: </span>
          {analysis.result.reason}
        </p>
      </div>
    );
  }

  if (isResumeRewriteResult(analysis.result)) {
    return (
      <>
        <p className="inline-flex border border-[#e5e5df] bg-white px-2 py-1 text-sm text-[#5f5f58]">
          Rewrite goal:{" "}
          <span className="font-semibold text-[#171717]">
            {formatRewriteGoal(analysis.result.goal)}
          </span>
        </p>
        <div className="mt-4 space-y-3">
          {analysis.result.suggestions.map((suggestion, index) => (
            <div key={`${analysis.id}-${index}`} className="border border-[#e5e5df] bg-white p-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <HistoryRewriteText label="Original" text={suggestion.original} />
                <HistoryRewriteText
                  label="Improved"
                  text={suggestion.improved}
                  strong
                />
              </div>
              <p className="mt-3 border-t border-[#e5e5df] pt-3 text-sm leading-6 text-[#343430]">
                <span className="font-semibold text-[#171717]">Reason: </span>
                {suggestion.reason}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (isCoverLetterResult(analysis.result)) {
    return (
      <>
        <p className="whitespace-pre-wrap border-l border-[#d8d8d1] pl-4 text-sm leading-6 text-[#343430]">
          {analysis.result.coverLetter}
        </p>
        <p className="mt-3 text-sm text-[#5f5f58]">
          Tone:{" "}
          <span className="font-semibold text-[#171717]">
            {analysis.result.tone}
          </span>
        </p>
        <AnalysisList title="Highlights" items={analysis.result.highlights} />
      </>
    );
  }

  if (isInterviewPrepResult(analysis.result)) {
    return (
      <>
        <p className="inline-flex border border-[#e5e5df] bg-white px-2 py-1 text-sm capitalize text-[#5f5f58]">
          Focus:{" "}
          <span className="font-semibold text-[#171717]">
            {analysis.result.focus}
          </span>
        </p>
        <div className="mt-4 space-y-3">
          {analysis.result.questions.map((question) => (
            <div key={question.question} className="border border-[#e5e5df] bg-white p-3">
              <p className="text-sm font-semibold leading-6 text-[#171717] [overflow-wrap:anywhere]">
                {question.question}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5f5f58] [overflow-wrap:anywhere]">
                {question.suggestedAnswerDirection}
              </p>
            </div>
          ))}
        </div>
        <AnalysisList
          title="Weak points"
          items={analysis.result.weakPointFocusAreas}
        />
      </>
    );
  }

  if (isJdMatchResult(analysis.result)) {
    return (
      <>
        <p className="inline-flex border border-[#e5e5df] bg-white px-2 py-1 text-sm text-[#5f5f58]">
          Matching score:{" "}
          <span className="font-semibold text-[#171717]">
            {analysis.result.matchingScore}
          </span>
        </p>
        <AnalysisList title="Matched skills" items={analysis.result.matchedSkills} />
        <AnalysisList title="Missing skills" items={analysis.result.missingSkills} />
        <SuggestionList analysis={analysis} />
      </>
    );
  }

  if (isApplicationFollowUpResult(analysis.result)) {
    return (
      <>
        <p className="whitespace-pre-wrap border-l border-[#d8d8d1] pl-4 text-sm leading-6 text-[#343430]">
          {analysis.result.draft}
        </p>
        <p className="mt-3 text-sm text-[#5f5f58]">
          Tone:{" "}
          <span className="font-semibold text-[#171717]">
            {analysis.result.tone}
          </span>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="inline-flex border border-[#e5e5df] bg-white px-2 py-1 text-sm text-[#5f5f58]">
        Score:{" "}
        <span className="font-semibold text-[#171717]">
          {analysis.result.score}
        </span>
      </p>
      <AnalysisList title="Strengths" items={analysis.result.strengths} />
      <AnalysisList title="Weaknesses" items={analysis.result.weaknesses} />
      <ScoreCategorySummary result={analysis.result} />
      <ActionableInsightSummary result={analysis.result} />
      <SuggestionList analysis={analysis} />
    </>
  );
}

function SuggestionList({ analysis }: { analysis: CvAnalysis }) {
  if (!hasSuggestions(analysis.result)) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-[#e5e5df] pt-1">
      <AnalysisList title="Suggestions" items={analysis.result.suggestions} />
    </div>
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
            className="flex items-center justify-between gap-2 border border-[#e5e5df] bg-white px-2 py-1 text-sm"
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

function groupAnalysesByDay(analyses: CvAnalysis[]): HistoryGroup[] {
  const groups = new Map<string, HistoryGroup>();

  analyses.forEach((analysis) => {
    const date = new Date(analysis.createdAt);
    const key = Number.isNaN(date.getTime())
      ? analysis.createdAt
      : date.toISOString().slice(0, 10);
    const existing = groups.get(key);

    if (existing) {
      existing.analyses.push(analysis);
      return;
    }

    groups.set(key, {
      key,
      label: formatDay(analysis.createdAt),
      analyses: [analysis],
    });
  });

  return Array.from(groups.values());
}

function getScoreMovements(analyses: CvAnalysis[]) {
  const movements = new Map<string, ScoreMovement>();
  const byCv = new Map<string, CvAnalysis[]>();

  analyses
    .filter((analysis) => analysis.type === "CV_ANALYSIS")
    .forEach((analysis) => {
      byCv.set(analysis.cvId, [...(byCv.get(analysis.cvId) ?? []), analysis]);
    });

  byCv.forEach((cvAnalyses) => {
    const oldestFirst = [...cvAnalyses].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    oldestFirst.forEach((analysis, index) => {
      const previous = oldestFirst[index - 1];

      if (!previous) {
        return;
      }

      const currentResult = getCvAnalysisResult(analysis);
      const previousResult = getCvAnalysisResult(previous);

      if (!currentResult || !previousResult) {
        return;
      }

      movements.set(analysis.id, {
        scoreDelta: getNumberDelta(currentResult.score, previousResult.score),
        atsDelta: getNumberDelta(
          currentResult.scoringCategories?.atsReadiness,
          previousResult.scoringCategories?.atsReadiness,
        ),
        keywordDelta: getNumberDelta(
          currentResult.scoringCategories?.keywordOptimization,
          previousResult.scoringCategories?.keywordOptimization,
        ),
      });
    });
  });

  return movements;
}

function getWorkflowIdentity(type: CvAnalysis["type"]) {
  if (type === "JD_MATCH") {
    return {
      label: "Role match",
      eyebrow: "Targeting",
      icon: GitCompare,
    };
  }

  if (type === "RESUME_REWRITE") {
    return {
      label: "Resume improvement",
      eyebrow: "Rewrite",
      icon: PenLine,
    };
  }

  if (type === "REWRITE_REFINEMENT") {
    return {
      label: "Resume improvement",
      eyebrow: "Refinement",
      icon: Sparkles,
    };
  }

  if (type === "COVER_LETTER") {
    return {
      label: "Cover letter",
      eyebrow: "Application draft",
      icon: FilePenLine,
    };
  }

  if (type === "INTERVIEW_PREP") {
    return {
      label: "Interview prep",
      eyebrow: "Practice",
      icon: ClipboardList,
    };
  }

  if (type === "APPLICATION_FOLLOW_UP") {
    return {
      label: "Application follow-up",
      eyebrow: "Follow-up",
      icon: MessageSquareText,
    };
  }

  return {
    label: "Resume analysis",
    eyebrow: "Resume review",
    icon: FileText,
  };
}

function getPrimaryMetric(analysis: CvAnalysis) {
  if (isJdMatchResult(analysis.result)) {
    return `Match ${analysis.result.matchingScore}`;
  }

  if (isResumeRewriteResult(analysis.result)) {
    return `${analysis.result.suggestions.length} rewrites`;
  }

  if (isRewriteRefinementResult(analysis.result)) {
    return "Refined";
  }

  if (isCoverLetterResult(analysis.result)) {
    return "Draft";
  }

  if (isInterviewPrepResult(analysis.result)) {
    return `${analysis.result.questions.length} questions`;
  }

  if (isApplicationFollowUpResult(analysis.result)) {
    return "Follow-up";
  }

  return `Score ${analysis.result.score}`;
}

function getInsightPreview(analysis: CvAnalysis) {
  if (isJdMatchResult(analysis.result)) {
    const missing = analysis.result.missingSkills?.slice(0, 2).join(", ");
    const matched = analysis.result.matchedSkills?.slice(0, 2).join(", ");

    if (missing) {
      return `Role fit is strongest where skills match; close gaps around ${missing}.`;
    }

    return matched
      ? `Strong alignment around ${matched}.`
      : "Saved role comparison with targeting guidance.";
  }

  if (isResumeRewriteResult(analysis.result)) {
    return (
      analysis.result.suggestions[0]?.improved ??
      "Resume bullets were rewritten for clearer evidence."
    );
  }

  if (isRewriteRefinementResult(analysis.result)) {
    return analysis.result.improved;
  }

  if (isCoverLetterResult(analysis.result)) {
    return firstLine(analysis.result.coverLetter);
  }

  if (isInterviewPrepResult(analysis.result)) {
    return (
      analysis.result.questions[0]?.question ??
      "Interview preparation was generated for this role context."
    );
  }

  if (isApplicationFollowUpResult(analysis.result)) {
    return firstLine(analysis.result.draft);
  }

  return (
    analysis.result.suggestions?.[0] ??
    analysis.result.weaknesses?.[0] ??
    analysis.result.strengths?.[0] ??
    "Resume quality review saved with improvement guidance."
  );
}

function getSignals(
  analysis: CvAnalysis,
  scoreMovement?: ScoreMovement,
  isRepeated?: boolean,
) {
  const signals: string[] = [];

  if (scoreMovement?.scoreDelta) {
    signals.push(formatMovement("Score improved", scoreMovement.scoreDelta));
  }

  if (scoreMovement?.atsDelta) {
    signals.push(formatMovement("ATS improved", scoreMovement.atsDelta));
  }

  if (scoreMovement?.keywordDelta && scoreMovement.keywordDelta > 0) {
    signals.push("Stronger keyword alignment");
  }

  if (isJdMatchResult(analysis.result)) {
    signals.push(`${analysis.result.matchedSkills?.length ?? 0} skills matched`);

    if ((analysis.result.missingSkills?.length ?? 0) > 0) {
      signals.push(`${analysis.result.missingSkills?.length ?? 0} gaps to close`);
    }
  }

  if (isResumeRewriteResult(analysis.result)) {
    signals.push(formatRewriteGoal(analysis.result.goal));
  }

  if (isRewriteRefinementResult(analysis.result)) {
    signals.push("Rewrite refined");
  }

  if (isCoverLetterResult(analysis.result) || isApplicationFollowUpResult(analysis.result)) {
    signals.push("Application draft generated");
  }

  if (isInterviewPrepResult(analysis.result)) {
    signals.push(`${analysis.result.focus} practice`);
  }

  if (isRepeated) {
    signals.push("Repeated workflow summarized");
  }

  return signals.slice(0, 3);
}

function formatDay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
  }).format(date);
}

function getNumberDelta(current?: number, previous?: number) {
  if (typeof current !== "number" || typeof previous !== "number") {
    return undefined;
  }

  return current - previous;
}

function getCvAnalysisResult(analysis: CvAnalysis) {
  if (!("score" in analysis.result)) {
    return null;
  }

  return analysis.result;
}

function formatMovement(label: string, delta: number) {
  if (delta > 0) {
    return `${label} +${delta}`;
  }

  if (delta < 0) {
    return `${label} ${delta}`;
  }

  return `${label} unchanged`;
}

function firstLine(value: string) {
  return value.split(/\n+/).find(Boolean) ?? value;
}

function formatRewriteGoal(goal: string) {
  return goal
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
