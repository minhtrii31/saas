"use client";

import {
  Activity,
  ArrowUpRight,
  FileText,
  ListChecks,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  fetchCvAnalyses,
  fetchCvProgress,
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/dashboard/result-ui";
import type { CvAnalysis, CvItem, CvProgress, CvProgressPoint } from "@/lib/api";

type ProgressState =
  | { type: "loading" }
  | {
      type: "ready";
      cvs: CvItem[];
      selectedCvId: string;
      progress: CvProgress | null;
      analyses: CvAnalysis[];
    }
  | { type: "error"; message: string };

const categoryLabels = {
  atsReadiness: "ATS readiness",
  readability: "Readability",
  impact: "Impact",
  keywordOptimization: "Keyword optimization",
  structure: "Structure",
  experienceQuality: "Experience quality",
};

export default function ProgressPage() {
  return (
    <ProtectedPage
      title="Resume Progress"
      description="Track how your resume improves over time through audits, rewrites, and role targeting."
    >
      {({ token }) => <ProgressContent token={token} />}
    </ProtectedPage>
  );
}

function ProgressContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<ProgressState>({ type: "loading" });

  useEffect(() => {
    let isActive = true;

    async function loadProgress() {
      try {
        const cvs = await fetchCvs(token);
        const selectedCvId = cvs[0]?.id ?? "";
        const progress = selectedCvId
          ? await fetchCvProgress(token, selectedCvId)
          : null;
        const analyses = selectedCvId
          ? await fetchCvAnalyses(token, selectedCvId)
          : [];

        if (isActive) {
          setState({ type: "ready", cvs, selectedCvId, progress, analyses });
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
          message: getApiErrorMessage(error, "Unable to load progress data."),
        });
      }
    }

    void loadProgress();

    return () => {
      isActive = false;
    };
  }, [router, token]);

  async function handleCvChange(cvId: string) {
    if (state.type !== "ready") {
      return;
    }

    setState({ ...state, selectedCvId: cvId, progress: null, analyses: [] });

    try {
      const [progress, analyses] = await Promise.all([
        fetchCvProgress(token, cvId),
        fetchCvAnalyses(token, cvId),
      ]);
      setState({ ...state, selectedCvId: cvId, progress, analyses });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to load progress data."),
      });
    }
  }

  if (state.type === "loading") {
    return <LoadingSkeleton label="Loading resume progress" className="p-6" />;
  }

  if (state.type === "error") {
    return (
      <ErrorState
        title="Progress did not load"
        message={state.message}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  const selectedCv = state.cvs.find((cv) => cv.id === state.selectedCvId);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#d8d8d1] bg-white p-6 md:p-7">
          <h2 className="max-w-3xl font-serif text-4xl text-[#171717] md:text-5xl">
            Every edit becomes evidence.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5f5f58]">
            Track how your resume improves over time through audits, rewrites,
            and role targeting.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-[#343430] md:grid-cols-3">
            <HeroCue icon={Sparkles} text="See what improved" />
            <HeroCue icon={ListChecks} text="Spot what still needs work" />
            <HeroCue icon={Target} text="Choose the next best action" />
          </div>
        </div>
        <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
          <CvSelector
            cvs={state.cvs}
            selectedCvId={state.selectedCvId}
            onChange={handleCvChange}
          />
          {selectedCv ? (
            <div className="mt-5 border-t border-[#e5e5df] pt-5 text-sm text-[#5f5f58]">
              <p className="font-semibold text-[#171717]">
                {selectedCv.title || selectedCv.originalName}
              </p>
              <p className="mt-1 text-xs">
                Added {formatDateTime(selectedCv.createdAt)}
              </p>
            </div>
          ) : null}
        </aside>
      </section>

      {state.cvs.length === 0 ? (
        <EmptyProgressState />
      ) : state.progress ? (
        <ProgressDashboard progress={state.progress} analyses={state.analyses} />
      ) : (
        <LoadingSkeleton label="Loading selected CV progress" className="p-6" />
      )}
    </div>
  );
}

function ProgressDashboard({
  progress,
  analyses,
}: {
  progress: CvProgress;
  analyses: CvAnalysis[];
}) {
  const latestCategories = progress.scoringCategoryTrends.at(-1)?.categories;
  const hasHistory = progress.scoreTimeline.length > 0;
  const bestMatchScore = getBestMatchScore(analyses);
  const insights = buildProgressInsights(progress);

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <div className="border border-[#d8d8d1] bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                Main progress summary
              </p>
              <h3 className="mt-3 font-serif text-3xl text-[#171717]">
                Your resume is becoming easier to trust.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#5f5f58]">
                Use this snapshot to see whether recent audits, rewrites, and
                role checks are turning into stronger application evidence.
              </p>
            </div>
            <ScoreBadge value={progress.summary.latestScore} />
          </div>

          <div className="mt-6 grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] md:grid-cols-3">
            <ProgressMetric
              icon={ArrowUpRight}
              label="ATS improvement"
              value={formatDelta(progress.improvementDeltas.atsReadiness)}
              helper="Change since the first audit"
            />
            <ProgressMetric
              icon={Target}
              label="Best role match"
              value={formatNullableScore(bestMatchScore)}
              helper="Highest saved match score"
            />
            <ProgressMetric
              icon={Activity}
              label="Rewrite activity"
              value={String(progress.summary.totalRewriteActions)}
              helper="Resume improvements saved"
            />
          </div>
        </div>

        {hasHistory ? (
          <NextStepCard progress={progress} bestMatchScore={bestMatchScore} />
        ) : (
          <ProgressTrackingIntro />
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <Panel
          title="Resume improvement timeline"
          description="Each bar is a saved audit, so the timeline grows as you revise and re-check the same CV."
        >
          {hasHistory ? (
            <LineBars points={progress.scoreTimeline} label="Score" />
          ) : (
            <PanelEmpty>
              Run another analysis after improving your CV to build a timeline.
            </PanelEmpty>
          )}
        </Panel>

        <Panel
          title="Progress insights"
          description="Readable signals about what changed and where your next effort can pay off."
        >
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight}
                className="border border-[#e5e5df] bg-[#fbfbfa] px-4 py-3 text-sm font-medium text-[#171717]"
              >
                {insight}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="ATS readiness movement"
          description="A lightweight view of how well the resume is structured for parsing and screening."
        >
          {progress.atsTrend.length ? (
            <LineBars points={progress.atsTrend} label="ATS readiness" />
          ) : (
            <PanelEmpty>
              ATS readiness appears after audits include category scoring.
            </PanelEmpty>
          )}
        </Panel>

        <Panel
          title="Resume improvement activity"
          description="Rewrites and refinements show where you actively strengthened resume wording."
        >
          {progress.rewriteActivityTrend.length ? (
            <RewriteBars progress={progress} />
          ) : (
            <PanelEmpty>
              Start a resume rewrite to record concrete wording improvements.
            </PanelEmpty>
          )}
        </Panel>
      </section>

      <Panel
        title="Improvement areas"
        description="Latest resume quality areas with movement from the first audit."
      >
        {latestCategories ? (
          <div className="grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] md:grid-cols-3">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <CategoryTile
                key={key}
                label={label}
                value={latestCategories[key as keyof typeof categoryLabels]}
                delta={
                  progress.improvementDeltas[
                    key as keyof typeof progress.improvementDeltas
                  ]
                }
              />
            ))}
          </div>
        ) : (
          <PanelEmpty>
            Category insights appear after multiple audits with scoring detail.
          </PanelEmpty>
        )}
      </Panel>
    </div>
  );
}

function HeroCue({
  icon: Icon,
  text,
}: {
  icon: typeof Sparkles;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 border border-[#e5e5df] bg-[#fbfbfa] px-3 py-2">
      <Icon className="h-4 w-4 text-[#3b5f58]" aria-hidden="true" />
      <span className="font-medium">{text}</span>
    </div>
  );
}

function ProgressMetric({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="flex min-h-32 flex-col justify-between bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
      </div>
      <div>
        <p className="font-mono text-3xl font-semibold text-[#171717]">
          {value}
        </p>
        <p className="mt-2 text-xs leading-5 text-[#6f6f68]">{helper}</p>
      </div>
    </div>
  );
}

function ScoreBadge({ value }: { value: number | null }) {
  return (
    <div className="min-w-36 border border-[#e5e5df] bg-[#f7f7f4] px-5 py-4 text-center">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        Latest score
      </p>
      <p className="mt-2 font-serif text-5xl text-[#171717]">
        {formatNullableScore(value)}
      </p>
      <p className="mt-1 font-mono text-[10px] font-bold uppercase text-[#6f6f68]">
        out of 100
      </p>
    </div>
  );
}

function ProgressTrackingIntro() {
  return (
    <aside className="border border-[#d8d8d1] bg-[#f7f7f4] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717]">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[#171717]">
            How progress tracking works
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            Nyx compares saved audits and rewrite sessions for this CV. Run an
            audit, improve the wording, then audit again to see what moved.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ActionLink href="/dashboard/analyze">Run first audit</ActionLink>
            <ActionLink href="/dashboard/rewrite" variant="secondary">
              Start resume rewrite
            </ActionLink>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NextStepCard({
  progress,
  bestMatchScore,
}: {
  progress: CvProgress;
  bestMatchScore: number | null;
}) {
  const nextStep = getNextStep(progress, bestMatchScore);

  return (
    <aside className="border border-[#d8d8d1] bg-[#f7f7f4] p-5">
      <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        What to do next
      </p>
      <h3 className="mt-3 text-xl font-semibold text-[#171717]">
        {nextStep.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#5f5f58]">
        {nextStep.description}
      </p>
      <div className="mt-5">
        <ActionLink href={nextStep.href}>{nextStep.label}</ActionLink>
      </div>
    </aside>
  );
}

function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "bg-[#171717] text-white hover:bg-[#2b2926]"
      : "border border-[#cfcfc8] bg-white text-[#343430] hover:bg-[#f1f1ee]";

  return (
    <a
      href={href}
      className={`inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold transition ${className}`}
    >
      {children}
    </a>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-[#e5e5df] bg-white p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-[#171717]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#5f5f58]">{description}</p>
      </div>
      {children}
    </section>
  );
}

function PanelEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-5 text-sm text-[#5f5f58]">
      {children}
    </div>
  );
}

function LineBars({
  points,
  label,
}: {
  points: CvProgressPoint[];
  label: string;
}) {
  return (
    <div className="flex min-h-56 items-end gap-3 border border-[#e5e5df] bg-[#fbfbfa] p-4">
      {points.map((point) => (
        <div
          key={point.analysisId}
          className="flex min-w-0 flex-1 flex-col items-center gap-2"
        >
          <div className="flex h-40 w-full items-end bg-[#f1f1ee]">
            <div
              aria-label={`${label} ${point.score}`}
              className="w-full bg-[#171717]"
              style={{ height: `${Math.max(point.score, 4)}%` }}
            />
          </div>
          <p className="font-mono text-sm font-semibold text-[#171717]">
            {point.score}
          </p>
          <p className="truncate text-[11px] text-[#6f6f68]">
            {formatShortDate(point.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RewriteBars({ progress }: { progress: CvProgress }) {
  const max = Math.max(...progress.rewriteActivityTrend.map((point) => point.total));

  return (
    <div className="space-y-3">
      {progress.rewriteActivityTrend.map((point) => (
        <div key={point.date} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3">
          <p className="text-xs font-medium text-[#6f6f68]">
            {formatShortDate(point.date)}
          </p>
          <div className="h-8 bg-[#f1f1ee]">
            <div
              className="h-full bg-[#3b5f58]"
              style={{ width: `${Math.max((point.total / max) * 100, 8)}%` }}
            />
          </div>
          <p className="text-right font-mono text-sm font-semibold text-[#171717]">
            {point.total}
          </p>
        </div>
      ))}
    </div>
  );
}

function CategoryTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: number | null;
  delta: number | null | undefined;
}) {
  return (
    <div className="min-h-28 bg-white p-4">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="font-mono text-2xl font-semibold text-[#171717]">
          {formatNullableScore(value)}
        </p>
        <p className="font-mono text-sm font-semibold text-[#3b5f58]">
          {formatDelta(delta)}
        </p>
      </div>
    </div>
  );
}

function EmptyProgressState() {
  return (
    <EmptyState
      icon={FileText}
      title="Your progress workspace starts with one CV"
      description="Upload a CV, run an audit, and Nyx will begin tracking score movement, rewrite activity, and role fit over time."
      action={
        <div className="flex flex-wrap gap-3">
          <ActionLink href="/dashboard/cvs">Upload CV</ActionLink>
          <ActionLink href="/dashboard/analyze" variant="secondary">
            Run first audit
          </ActionLink>
        </div>
      }
    />
  );
}

function buildProgressInsights(progress: CvProgress) {
  const insights: string[] = [];
  const atsDelta = progress.improvementDeltas.atsReadiness;
  const keywordDelta = progress.improvementDeltas.keywordOptimization;
  const scoreDelta = progress.summary.latestScoreVsEarliestScore;

  if (atsDelta !== null && atsDelta > 0) {
    insights.push("ATS readiness improved after recent resume work.");
  }

  if (keywordDelta !== null && keywordDelta > 0) {
    insights.push("Keyword optimization increased in the latest audit.");
  }

  if (progress.summary.totalRewriteActions > 0) {
    insights.push(
      `${progress.summary.totalRewriteActions} rewrite ${progress.summary.totalRewriteActions === 1 ? "session is" : "sessions are"} now part of this CV's progress record.`,
    );
  }

  if (scoreDelta !== null && scoreDelta > 0) {
    insights.push(`Overall resume score is up ${scoreDelta} points.`);
  }

  if (insights.length === 0) {
    insights.push("No measurable score changes yet.");
    insights.push("Run another analysis after improving your CV to build a timeline.");
  }

  return insights;
}

function getBestMatchScore(analyses: CvAnalysis[]) {
  const matchScores = analyses
    .filter((analysis) => analysis.type === "JD_MATCH")
    .map((analysis) => {
      const result = analysis.result;
      return "matchingScore" in result ? result.matchingScore : null;
    })
    .filter((score): score is number => typeof score === "number");

  return matchScores.length ? Math.max(...matchScores) : null;
}

function getNextStep(progress: CvProgress, bestMatchScore: number | null) {
  if (progress.summary.totalScoreAnalyses === 0) {
    return {
      title: "Create your baseline audit",
      description:
        "Run one audit first. After that, Nyx can compare future changes against a clear starting point.",
      label: "Run first audit",
      href: "/dashboard/analyze",
    };
  }

  if (progress.summary.totalRewriteActions === 0) {
    return {
      title: "Turn feedback into stronger bullets",
      description:
        "Your audit gives direction. A rewrite session turns that direction into concrete wording you can review and refine.",
      label: "Start resume rewrite",
      href: "/dashboard/rewrite",
    };
  }

  if (bestMatchScore === null) {
    return {
      title: "Check this CV against a real role",
      description:
        "A role match shows whether your improved CV is aligned with the job you actually want next.",
      label: "Compare with job",
      href: "/dashboard/match",
    };
  }

  return {
    title: "Re-audit after your next edit",
    description:
      "You have evidence of improvement. Keep the loop going by auditing after the next meaningful resume change.",
    label: "Run another audit",
    href: "/dashboard/analyze",
  };
}

function formatNullableScore(value: number | null | undefined) {
  return value === null || value === undefined ? "--" : String(value);
}

function formatDelta(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }

  return value > 0 ? `+${value}` : String(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
