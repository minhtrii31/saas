"use client";

import {
  ArrowUpRight,
  FilePenLine,
  FileText,
  GitCompare,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvAnalyses,
  fetchCvs,
  getApiErrorMessage,
  isJdMatchResult,
  isUnauthorizedError,
  sortAnalysesNewestFirst,
} from "@/components/dashboard/api";
import { formatAnalysisType, formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import type { AuthUser, CvAnalysis, CvItem } from "@/lib/api";

type DashboardState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[]; analyses: CvAnalysis[] }
  | { type: "error"; message: string };

const workflow = [
  {
    href: "/dashboard/cvs",
    step: "01",
    label: "Repository",
    title: "Upload CV asset",
    description: "Add source material before analysis.",
    icon: Upload,
    action: "Open repository",
  },
  {
    href: "/dashboard/analyze",
    step: "02",
    label: "Audit",
    title: "AI audit workspace",
    description: "Find weak signals and improvement areas.",
    icon: Sparkles,
    action: "Run audit",
  },
  {
    href: "/dashboard/match",
    step: "03",
    label: "Match",
    title: "Job suitability matcher",
    description: "Compare a CV against a target role.",
    icon: GitCompare,
    action: "Match role",
  },
  {
    href: "/dashboard/cover-letter",
    step: "04",
    label: "Draft",
    title: "Cover letter studio",
    description: "Draft a tailored application note.",
    icon: FilePenLine,
    action: "Generate draft",
  },
];

export default function DashboardPage() {
  return (
    <ProtectedPage
      title="Dashboard"
      description="Choose the task you want to complete."
    >
      {({ token, user }) => <DashboardContent token={token} user={user} />}
    </ProtectedPage>
  );
}

function DashboardContent({ token, user }: { token: string; user: AuthUser }) {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({ type: "loading" });

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const cvs = await fetchCvs(token);
        const analysisResults = await Promise.all(
          cvs.map((cv) => fetchCvAnalyses(token, cv.id)),
        );
        const analyses = sortAnalysesNewestFirst(analysisResults.flat());

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
            "Unable to load your dashboard workspace.",
          ),
        });
      }
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [router, token]);

  if (state.type === "loading") {
    return <DashboardSkeleton />;
  }

  if (state.type === "error") {
    return (
      <p
        role="alert"
        className="border border-[#e7d8cf] bg-[#fff7f2] px-4 py-3 text-sm text-[#8a3f24]"
      >
        {state.message}
      </p>
    );
  }

  return <DashboardOverview user={user} cvs={state.cvs} analyses={state.analyses} />;
}

function DashboardOverview({
  user,
  cvs,
  analyses,
}: {
  user: AuthUser;
  cvs: CvItem[];
  analyses: CvAnalysis[];
}) {
  const displayName = user.name || user.email.split("@")[0] || "there";
  const latestCv = cvs[0];
  const latestAnalyses = analyses.slice(0, 4);
  const avgScore = useMemo(() => getAverageScore(analyses), [analyses]);
  const coverLetters = analyses.filter(
    (analysis) => analysis.type === "COVER_LETTER",
  ).length;
  const matches = analyses.filter((analysis) => analysis.type === "JD_MATCH").length;
  const recommendedAction = getRecommendedAction(cvs, analyses);

  return (
    <div className="space-y-7">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
        <div className="border border-[#e5e5df] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
            Career workspace
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-[1] tracking-[-0.045em] text-[#171717] md:text-5xl">
            Build a sharper application system.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f5f58]">
            Welcome back, {displayName}. Upload a CV, run an audit, compare it
            with a target role, and create a cover letter from the results.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/cvs"
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926]"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload CV
            </Link>
            <Link
              href="/dashboard/analyze"
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#cfcfc8] bg-white px-4 text-sm font-semibold text-[#171717] transition hover:bg-[#f1f1ee]"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Start audit
            </Link>
          </div>
        </div>

        <div className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
            Current state
          </p>
          <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df]">
            <StateMetric label="CVs" value={String(cvs.length)} />
            <StateMetric label="Runs" value={String(analyses.length)} />
            <StateMetric label="Avg" value={avgScore === null ? "--" : `${avgScore}%`} />
          </div>
          <div className="mt-5 border-t border-[#e5e5df] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6f68]">
              Latest document
            </p>
            {latestCv ? (
              <Link
                href={`/dashboard/cvs/${latestCv.id}`}
                className="mt-3 flex items-start justify-between gap-4 text-sm transition hover:text-[#171717]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[#171717]">
                    {latestCv.title || latestCv.originalName}
                  </span>
                  <span className="mt-1 block text-xs text-[#6f6f68]">
                    Uploaded {formatDateTime(latestCv.createdAt)}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#6f6f68]" />
              </Link>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#5f5f58]">
                No CVs yet. Upload one to unlock analysis, matching, and cover
                letter generation.
              </p>
            )}
          </div>
          <div className="mt-5 border-t border-[#e5e5df] pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6f68]">
              Recommended next
            </p>
            <Link
              href={recommendedAction.href}
              className="group mt-3 flex items-start justify-between gap-4"
            >
              <span>
                <span className="block text-sm font-semibold text-[#171717]">
                  {recommendedAction.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-[#5f5f58]">
                  {recommendedAction.description}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-[#6f6f68] transition group-hover:text-[#171717]"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="workflow-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
              Workflow
            </p>
            <h3
              id="workflow-heading"
              className="mt-1 text-xl font-semibold text-[#171717]"
            >
              Choose the next task
            </h3>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item) => {
            const Icon = item.icon;
            const status = getWorkflowStatus(item.label, cvs, analyses);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group border border-[#e5e5df] bg-white p-4 transition hover:border-[#cfcfc8] hover:bg-[#f7f7f4]"
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon
                    className="h-4 w-4 text-[#6f6f68] transition group-hover:text-[#171717]"
                    aria-hidden="true"
                  />
                  <ArrowUpRight
                    className="h-4 w-4 text-[#a1a19a] transition group-hover:text-[#171717]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                  {item.step} / {item.label} / {status}
                </p>
                <h4 className="mt-2 text-sm font-semibold text-[#171717]">
                  {item.title}
                </h4>
                <p className="mt-2 min-h-10 text-sm leading-5 text-[#5f5f58]">
                  {item.description}
                </p>
                <p className="mt-5 text-xs font-semibold text-[#171717]">
                  {item.action}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-[#e5e5df] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                Recent activity
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#171717]">
                Analysis timeline
              </h3>
            </div>
            <Link
              href="/dashboard/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5f5f58] hover:text-[#171717]"
            >
              Full history
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {latestAnalyses.length > 0 ? (
            <ul className="mt-5 divide-y divide-[#e5e5df]">
              {latestAnalyses.map((analysis) => (
                <li key={analysis.id} className="flex items-start gap-3 py-3">
                  <AnalysisIcon type={analysis.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#171717]">
                      {formatAnalysisType(analysis.type)}
                    </p>
                    <p className="mt-1 text-xs text-[#6f6f68]">
                      {formatDateTime(analysis.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-5 text-sm leading-6 text-[#5f5f58]">
              No analysis history yet. Start with an audit to create your first
              saved result.
            </div>
          )}
        </div>

        <div className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
            Operating mix
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            What the workspace has produced
          </h3>
          <div className="mt-5 space-y-3">
            <SignalRow label="CV analyses" value={analysisCount(analyses, "CV_ANALYSIS")} />
            <SignalRow label="Job matches" value={matches} />
            <SignalRow label="Cover letters" value={coverLetters} />
          </div>
          <div className="mt-6 border-t border-[#e5e5df] pt-5">
            <Link
              href="/dashboard/match"
              className="group flex items-center justify-between gap-4 text-sm font-semibold text-[#171717]"
            >
              <span>Compare your best CV against a target role</span>
              <ArrowUpRight
                className="h-4 w-4 text-[#6f6f68] transition group-hover:text-[#171717]"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7" role="status" aria-label="Loading dashboard">
      <section className="border border-[#e5e5df] bg-white p-6 md:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
          Career workspace
        </p>
        <h2 className="mt-4 max-w-3xl font-serif text-4xl leading-[1] tracking-[-0.045em] text-[#171717] md:text-5xl">
          Preparing your workspace.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f5f58]">
          Loading documents, saved analyses, and workspace state...
        </p>
      </section>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {workflow.map((item) => (
          <div
            key={item.href}
            className="h-40 border border-[#e5e5df] bg-white"
          />
        ))}
      </div>
    </div>
  );
}

function StateMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white p-4">
      <dt className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </dt>
      <dd className="mt-2 truncate text-base font-semibold text-[#171717]">
        {value}
      </dd>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border border-[#e5e5df] bg-white px-4 py-3">
      <span className="text-sm text-[#5f5f58]">{label}</span>
      <span className="font-mono text-sm font-semibold text-[#171717]">
        {value}
      </span>
    </div>
  );
}

function AnalysisIcon({ type }: { type: CvAnalysis["type"] }) {
  const Icon =
    type === "JD_MATCH" ? GitCompare : type === "COVER_LETTER" ? FilePenLine : FileText;

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f1f1ee] text-[#343430]">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function analysisCount(analyses: CvAnalysis[], type: CvAnalysis["type"]) {
  return analyses.filter((analysis) => analysis.type === type).length;
}

function getRecommendedAction(cvs: CvItem[], analyses: CvAnalysis[]) {
  if (cvs.length === 0) {
    return {
      href: "/dashboard/cvs",
      title: "Upload your first CV",
      description: "Start with the source document so every workflow has real input.",
    };
  }

  if (analysisCount(analyses, "CV_ANALYSIS") === 0) {
    return {
      href: "/dashboard/analyze",
      title: "Run a CV audit",
      description: "Get the first quality baseline before matching any role.",
    };
  }

  if (analysisCount(analyses, "JD_MATCH") === 0) {
    return {
      href: "/dashboard/match",
      title: "Compare against a role",
      description: "Use a job description to expose matched and missing signals.",
    };
  }

  if (analysisCount(analyses, "COVER_LETTER") === 0) {
    return {
      href: "/dashboard/cover-letter",
      title: "Generate a draft",
      description: "Turn the CV and role context into an editable application note.",
    };
  }

  return {
    href: "/dashboard/history",
    title: "Review saved results",
    description: "Check previous outputs before changing your next application.",
  };
}

function getWorkflowStatus(
  label: string,
  cvs: CvItem[],
  analyses: CvAnalysis[],
) {
  if (label === "Repository") {
    return cvs.length > 0 ? "ready" : "empty";
  }

  if (label === "Audit") {
    return analysisCount(analyses, "CV_ANALYSIS") > 0 ? "active" : "next";
  }

  if (label === "Match") {
    return analysisCount(analyses, "JD_MATCH") > 0 ? "active" : "ready";
  }

  if (label === "Draft") {
    return analysisCount(analyses, "COVER_LETTER") > 0 ? "active" : "ready";
  }

  return "ready";
}

function getAverageScore(analyses: CvAnalysis[]) {
  const scores = analyses
    .map((analysis) => {
      if (isJdMatchResult(analysis.result)) {
        return analysis.result.matchingScore;
      }

      if ("score" in analysis.result) {
        return analysis.result.score;
      }

      return null;
    })
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) {
    return null;
  }

  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}
