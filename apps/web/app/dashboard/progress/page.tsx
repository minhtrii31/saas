"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
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
import type { CvItem, CvProgress, CvProgressPoint } from "@/lib/api";

type ProgressState =
  | { type: "loading" }
  | {
      type: "ready";
      cvs: CvItem[];
      selectedCvId: string;
      progress: CvProgress | null;
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
      title="Progress"
      description="Track how your resume quality changes over time."
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

        if (isActive) {
          setState({ type: "ready", cvs, selectedCvId, progress });
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

    setState({ ...state, selectedCvId: cvId, progress: null });

    try {
      const progress = await fetchCvProgress(token, cvId);
      setState({ ...state, selectedCvId: cvId, progress });
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
        <div className="border border-[#e5e5df] bg-white p-6 md:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
            Resume progress
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl text-[#171717] md:text-5xl">
            See the work turn into measurable lift.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#5f5f58]">
            Compare saved audits, ATS readiness, and rewrite activity for one CV.
          </p>
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
        <ProgressDashboard progress={state.progress} />
      ) : (
        <LoadingSkeleton label="Loading selected CV progress" className="p-6" />
      )}
    </div>
  );
}

function ProgressDashboard({ progress }: { progress: CvProgress }) {
  const latestCategories = progress.scoringCategoryTrends.at(-1)?.categories;
  const hasHistory = progress.scoreTimeline.length > 0;
  const insights = progress.summary.insights.length
    ? progress.summary.insights
    : ["Run another analysis after improving your CV to create a trend."];

  return (
    <div className="space-y-5">
      <section className="grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] md:grid-cols-4">
        <ProgressMetric
          icon={TrendingUp}
          label="Latest score"
          value={formatNullableScore(progress.summary.latestScore)}
        />
        <ProgressMetric
          icon={ArrowUpRight}
          label="Score lift"
          value={formatDelta(progress.summary.latestScoreVsEarliestScore)}
        />
        <ProgressMetric
          icon={BarChart3}
          label="ATS lift"
          value={formatDelta(progress.improvementDeltas.atsReadiness)}
        />
        <ProgressMetric
          icon={Activity}
          label="Rewrites this week"
          value={String(progress.summary.rewritesThisWeek)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <Panel title="Score trend" description="Quality score from saved CV audits.">
          {hasHistory ? (
            <LineBars points={progress.scoreTimeline} label="Score" />
          ) : (
            <PanelEmpty>No score history yet.</PanelEmpty>
          )}
        </Panel>

        <Panel title="Growth signals" description="Highlights from the timeline.">
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
        <Panel title="ATS trend" description="ATS readiness across CV audits.">
          {progress.atsTrend.length ? (
            <LineBars points={progress.atsTrend} label="ATS readiness" />
          ) : (
            <PanelEmpty>No ATS readiness trend yet.</PanelEmpty>
          )}
        </Panel>

        <Panel title="Rewrite activity" description="Resume rewrite work by day.">
          {progress.rewriteActivityTrend.length ? (
            <RewriteBars progress={progress} />
          ) : (
            <PanelEmpty>No rewrite activity yet.</PanelEmpty>
          )}
        </Panel>
      </section>

      <Panel
        title="Category movement"
        description="Latest category scores and their change from the first audit."
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
          <PanelEmpty>No category scores yet.</PanelEmpty>
        )}
      </Panel>
    </div>
  );
}

function ProgressMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-28 flex-col justify-between bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
      </div>
      <p className="font-mono text-3xl font-semibold text-[#171717]">{value}</p>
    </div>
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
      title="No progress data yet"
      description="Upload a CV and run an analysis to start tracking progress."
    />
  );
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
