"use client";

import { ClipboardList, FilePenLine, FileText, GitCompare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvAnalyses,
  fetchCvs,
  getApiErrorMessage,
  isJdMatchResult,
  isResumeRewriteResult,
  isRewriteRefinementResult,
  isApplicationFollowUpResult,
  isCoverLetterResult,
  isUnauthorizedError,
  sortAnalysesNewestFirst,
} from "@/components/dashboard/api";
import { HistoryList } from "@/components/dashboard/history/history-list";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { ErrorState, LoadingSkeleton } from "@/components/dashboard/result-ui";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { formatAnalysisType, formatDateTime } from "@/components/dashboard/format";
import type { CvAnalysis, CvItem } from "@/lib/api";

type HistoryState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[]; analyses: CvAnalysis[] }
  | { type: "error"; message: string };

export default function HistoryPage() {
  return (
    <ProtectedPage
      title="History"
      description="Review your resume improvements, role targeting, and application work over time."
    >
      {({ token }) => <HistoryContent token={token} />}
    </ProtectedPage>
  );
}

function HistoryContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<HistoryState>({ type: "loading" });

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      try {
        const cvs = await fetchCvs(token);
        const historyResults = await Promise.all(
          cvs.map((cv) => fetchCvAnalyses(token, cv.id)),
        );
        const analyses = sortAnalysesNewestFirst(historyResults.flat());

        if (isActive) {
          setState({ type: "ready", cvs, analyses });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }

        setState({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to load analysis history. Please try again.",
          ),
        });
      }
    }

    void loadHistory();

    return () => {
      isActive = false;
    };
  }, [router, token]);

  const cvsById = useMemo(() => {
    if (state.type !== "ready") {
      return new Map<string, CvItem>();
    }

    return new Map(state.cvs.map((cv) => [cv.id, cv]));
  }, [state]);

  if (state.type === "loading") {
    return (
      <LoadingSkeleton label="Loading analysis history" className="p-6" />
    );
  }

  if (state.type === "error") {
    return (
      <ErrorState
        title="History did not load"
        message={state.message}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  const summaries = getHistorySummaries(state.analyses).slice(0, 2);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <WorkspaceHero
          eyebrow="Career timeline"
          title="History"
          description="Review your resume improvements, role targeting, and application work over time."
        />
        <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Momentum brief
            </p>
            {state.analyses[0] ? (
              <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#a1a19a]">
                {formatAnalysisType(state.analyses[0].type)}
              </p>
            ) : (
              <p className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#a1a19a]">
                Empty
              </p>
            )}
          </div>
          <div className="mt-3 grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df]">
            {summaries.map((summary) => (
              <HistoryMetric
                key={summary.label}
                icon={summary.icon}
                label={summary.label}
                value={summary.value}
                detail={summary.detail}
              />
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#6f6f68]">
            {state.analyses[0]
              ? `Updated ${formatDateTime(state.analyses[0].createdAt)}`
              : "Your latest improvement signal will appear here."}
          </p>
        </aside>
      </section>

      <HistoryList analyses={state.analyses} cvsById={cvsById} />
    </div>
  );
}

function HistoryMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-[#ffffff] p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#343430]">
          <Icon className="h-4 w-4 shrink-0 text-[#6f6f68]" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
        </span>
        <span className="font-mono text-sm font-semibold text-[#171717]">
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[#6f6f68]">{detail}</p>
    </div>
  );
}

function countByType(analyses: CvAnalysis[], type: CvAnalysis["type"]) {
  return analyses.filter((analysis) => analysis.type === type).length;
}

function getHistorySummaries(analyses: CvAnalysis[]) {
  const scoreAnalyses = analyses.filter(
    (analysis) =>
      analysis.type === "CV_ANALYSIS" &&
      "score" in analysis.result &&
      typeof analysis.result.score === "number",
  );
  const latestScore = getScore(scoreAnalyses[0]);
  const earliestScore = getScore(scoreAnalyses.at(-1));
  const scoreDelta =
    typeof latestScore === "number" && typeof earliestScore === "number"
      ? latestScore - earliestScore
      : null;

  const atsScores = scoreAnalyses
    .map((analysis) =>
      "score" in analysis.result
        ? analysis.result.scoringCategories?.atsReadiness
        : undefined,
    )
    .filter((score): score is number => typeof score === "number");
  const atsDelta =
    atsScores.length > 1 ? atsScores[0] - atsScores[atsScores.length - 1] : null;

  const bestMatch = analyses.reduce<number | null>((best, analysis) => {
    if (!isJdMatchResult(analysis.result)) {
      return best;
    }

    return Math.max(best ?? 0, analysis.result.matchingScore);
  }, null);

  const draftsGenerated = analyses.filter(
    (analysis) =>
      isCoverLetterResult(analysis.result) ||
      isApplicationFollowUpResult(analysis.result),
  ).length;

  const rewriteActions = analyses.filter(
    (analysis) =>
      isResumeRewriteResult(analysis.result) ||
      isRewriteRefinementResult(analysis.result),
  ).length;

  return [
    {
      icon: FileText,
      label: "Latest score",
      value: typeof latestScore === "number" ? String(latestScore) : "None",
      detail:
        scoreDelta === null
          ? "Run resume reviews to see quality movement."
          : formatDelta(scoreDelta, "overall score"),
    },
    {
      icon: GitCompare,
      label: "Best match",
      value: typeof bestMatch === "number" ? String(bestMatch) : "None",
      detail:
        typeof bestMatch === "number"
          ? "Highest saved role targeting result."
          : "Compare a CV with a target role to track fit.",
    },
    {
      icon: ClipboardList,
      label: "Reviews completed",
      value: String(countByType(analyses, "CV_ANALYSIS")),
      detail:
        atsDelta === null
          ? "ATS movement appears after multiple scored reviews."
          : formatDelta(atsDelta, "ATS readiness"),
    },
    {
      icon: FilePenLine,
      label: "Drafts and rewrites",
      value: String(draftsGenerated + rewriteActions),
      detail: `${rewriteActions} rewrite actions and ${draftsGenerated} application drafts.`,
    },
  ];
}

function formatDelta(delta: number, label: string) {
  if (delta > 0) {
    return `${label} improved +${delta}`;
  }

  if (delta < 0) {
    return `${label} changed ${delta}`;
  }

  return `${label} is unchanged`;
}

function getScore(analysis?: CvAnalysis) {
  if (!analysis || !("score" in analysis.result)) {
    return undefined;
  }

  return analysis.result.score;
}
