"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  ClipboardList,
  FilePenLine,
  FileText,
  GitCompare,
  History,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  fetchApplications,
  fetchCvAnalyses,
  fetchCvs,
  getApiErrorMessage,
  isJdMatchResult,
  isUnauthorizedError,
  sortAnalysesNewestFirst,
} from "@/components/dashboard/api";
import {
  formatAnalysisType,
  formatDateTime,
} from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import type {
  ApplicationItem,
  ApplicationStatus,
  AuthUser,
  CvAnalysis,
  CvItem,
} from "@/lib/api";

type DashboardState =
  | { type: "loading" }
  | {
      type: "ready";
      cvs: CvItem[];
      analyses: CvAnalysis[];
      applications: ApplicationItem[];
    }
  | { type: "error"; message: string };

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const primaryActions = [
  {
    href: "/dashboard/analyze",
    label: "Analyze resume",
    description: "Get a clear quality baseline and improvement priorities.",
    icon: Sparkles,
  },
  {
    href: "/dashboard/match",
    label: "Match target role",
    description: "Compare your CV with a job description before applying.",
    icon: Target,
  },
  {
    href: "/dashboard/interview-prep",
    label: "Prepare interview",
    description: "Practice role-specific questions from your CV evidence.",
    icon: ClipboardList,
  },
];

const secondaryActions = [
  {
    href: "/dashboard/cvs",
    label: "Upload CV",
    icon: Upload,
  },
  {
    href: "/dashboard/applications",
    label: "Track application",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/history",
    label: "View history",
    icon: History,
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
        const [cvs, applications] = await Promise.all([
          fetchCvs(token),
          fetchApplications(token),
        ]);
        const analysisResults = await Promise.all(
          cvs.map((cv) => fetchCvAnalyses(token, cv.id)),
        );
        const analyses = sortAnalysesNewestFirst(analysisResults.flat());

        if (isActive) {
          setState({ type: "ready", cvs, analyses, applications });
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

  return (
    <DashboardOverview
      user={user}
      cvs={state.cvs}
      analyses={state.analyses}
      applications={state.applications}
    />
  );
}

function DashboardOverview({
  user,
  cvs,
  analyses,
  applications,
}: {
  user: AuthUser;
  cvs: CvItem[];
  analyses: CvAnalysis[];
  applications: ApplicationItem[];
}) {
  const displayName = user.name || user.email.split("@")[0] || "there";
  const latestCv = cvs[0];
  const latestAnalyses = analyses.slice(0, 3);
  const recommendedAction = getRecommendedAction(cvs, analyses);
  const statusCounts = getApplicationStatusCounts(applications);
  const activeApplications =
    statusCounts.SAVED + statusCounts.APPLIED + statusCounts.INTERVIEWING;
  const interviewingCount = statusCounts.INTERVIEWING;
  const activeApplication = applications.find((application) =>
    ["SAVED", "APPLIED", "INTERVIEWING"].includes(application.status),
  );
  const progressHighlights = getProgressHighlights(cvs, analyses, applications);
  const creditLabel =
    typeof user.creditBalance === "number"
      ? user.creditBalance.toLocaleString()
      : "Credits unavailable";
  const focusSummary = getFocusSummary(cvs, analyses, activeApplication);

  return (
    <div className="space-y-7">
      <section className="border border-[#e5e5df] bg-white p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
              Focus command center
            </p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl text-[#171717] md:text-5xl">
              Welcome back, {displayName}.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#5f5f58]">
              {focusSummary}
            </p>

            <div className="mt-7 grid gap-3 md:grid-cols-2">
              <FocusDetail
                label="Latest CV"
                value={
                  latestCv
                    ? latestCv.title || latestCv.originalName
                    : "No CV uploaded"
                }
                detail={
                  latestCv
                    ? `Uploaded ${formatDateTime(latestCv.createdAt)}`
                    : "Upload one before running AI workflows."
                }
                href={
                  latestCv ? `/dashboard/cvs/${latestCv.id}` : "/dashboard/cvs"
                }
              />
              <FocusDetail
                label="Active application"
                value={
                  activeApplication
                    ? `${activeApplication.roleTitle} at ${activeApplication.companyName}`
                    : "No active application"
                }
                detail={
                  activeApplication
                    ? applicationStatusLabels[activeApplication.status]
                    : "Track one when you have a target role."
                }
                href="/dashboard/applications"
              />
            </div>

            <div className="mt-7 border-t border-[#e5e5df] pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6f68]">
                Recommended next
              </p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[#171717]">
                    {recommendedAction.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f5f58]">
                    {recommendedAction.description}
                  </p>
                </div>
                <Link
                  href={recommendedAction.href}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926]"
                >
                  {recommendedAction.action}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
              Credits
            </p>
            <p className="mt-4 text-3xl font-semibold text-[#171717]">
              {typeof user.creditBalance === "number"
                ? `${creditLabel} credits`
                : creditLabel}
            </p>
            <p className="mt-3 text-sm leading-6 text-[#5f5f58]">
              Used only when AI actions complete.
            </p>
            <button
              type="button"
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center border border-[#cfcfc8] bg-white px-3 text-sm font-semibold text-[#171717] transition hover:bg-[#f1f1ee]"
            >
              Manage credits
            </button>
          </aside>
        </div>
      </section>

      <section aria-labelledby="workflow-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
              Primary actions
            </p>
            <h3
              id="workflow-heading"
              className="mt-1 text-xl font-semibold text-[#171717]"
            >
              Choose the next move
            </h3>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {primaryActions.map((item) => {
            const Icon = item.icon;

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
                <h4 className="mt-5 text-base font-semibold text-[#171717]">
                  {item.label}
                </h4>
                <p className="mt-2 min-h-10 text-sm leading-5 text-[#5f5f58]">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {secondaryActions.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-10 items-center gap-2 border border-[#e5e5df] bg-white px-3 text-sm font-semibold text-[#343430] transition hover:border-[#cfcfc8] hover:bg-[#f7f7f4]"
              >
                <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
          Progress snapshot
        </p>
        <h3 className="mt-1 text-lg font-semibold text-[#171717]">
          Three signals to watch
        </h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {progressHighlights.map((highlight) => (
            <Link
              key={highlight.title}
              href={highlight.href}
              className="group min-w-0 border border-[#e5e5df] bg-white p-4 transition hover:border-[#cfcfc8] hover:bg-[#fbfbfa]"
            >
              <div className="flex items-start justify-between gap-3">
                <highlight.icon
                  className="h-4 w-4 shrink-0 text-[#6f6f68] transition group-hover:text-[#171717]"
                  aria-hidden="true"
                />
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-[#a1a19a] transition group-hover:text-[#171717]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#171717]">
                {highlight.title}
              </p>
              <p className="mt-2 text-sm leading-5 text-[#5f5f58]">
                {highlight.detail}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-[#e5e5df] bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                Recent AI activity
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#171717]">
                Latest 3 AI actions
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
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#171717]">
                        {formatAnalysisType(analysis.type)}
                      </p>
                      <p className="shrink-0 font-mono text-xs font-semibold text-[#171717]">
                        {formatAnalysisScore(analysis)}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6f6f68]">
                      {formatDateTime(analysis.createdAt)} /{" "}
                      {getActivitySummary(analysis)}
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
            Applications
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Compact status summary
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df]">
            <StateMetric
              label="Active applications"
              value={String(activeApplications)}
            />
            <StateMetric
              label="Interviewing"
              value={String(interviewingCount)}
            />
          </div>
          <div className="mt-6 border-t border-[#e5e5df] pt-5">
            <Link
              href="/dashboard/applications"
              className="group flex items-center justify-between gap-4 text-sm font-semibold text-[#171717]"
            >
              <span>Open applications</span>
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

function FocusDetail({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group min-w-0 border border-[#e5e5df] bg-[#fbfbfa] p-4 transition hover:border-[#cfcfc8] hover:bg-[#f7f7f4]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </p>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-[#a1a19a] transition group-hover:text-[#171717]"
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-[#171717]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-[#5f5f58]">{detail}</p>
    </Link>
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
      <div className="grid gap-3 md:grid-cols-3">
        {primaryActions.map((item) => (
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

function AnalysisIcon({ type }: { type: CvAnalysis["type"] }) {
  const Icon =
    type === "JD_MATCH"
      ? GitCompare
      : type === "COVER_LETTER"
        ? FilePenLine
        : type === "INTERVIEW_PREP"
          ? ClipboardList
          : type === "APPLICATION_FOLLOW_UP"
            ? BriefcaseBusiness
            : type === "RESUME_REWRITE" || type === "REWRITE_REFINEMENT"
              ? FilePenLine
              : FileText;

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f1f1ee] text-[#343430]">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

function analysisCount(analyses: CvAnalysis[], type: CvAnalysis["type"]) {
  return analyses.filter((analysis) => analysis.type === type).length;
}

function getApplicationStatusCounts(applications: ApplicationItem[]) {
  return applications.reduce<Record<ApplicationStatus, number>>(
    (counts, application) => ({
      ...counts,
      [application.status]: counts[application.status] + 1,
    }),
    {
      SAVED: 0,
      APPLIED: 0,
      INTERVIEWING: 0,
      OFFER: 0,
      REJECTED: 0,
    },
  );
}

function getFocusSummary(
  cvs: CvItem[],
  analyses: CvAnalysis[],
  activeApplication?: ApplicationItem,
) {
  if (activeApplication) {
    return `Current focus: ${activeApplication.roleTitle} at ${
      activeApplication.companyName
    } is ${applicationStatusLabels[
      activeApplication.status
    ].toLowerCase()}. Keep the next action tied to that role.`;
  }

  if (cvs.length === 0) {
    return "Current focus: add your first CV so Nyx can build a useful baseline.";
  }

  if (analysisCount(analyses, "CV_ANALYSIS") === 0) {
    return "Current focus: turn your latest CV into a clear quality baseline.";
  }

  if (analysisCount(analyses, "JD_MATCH") === 0) {
    return "Current focus: compare your strongest CV against a real target role.";
  }

  return "Current focus: use your latest AI results to decide the next application move.";
}

function getRecommendedAction(cvs: CvItem[], analyses: CvAnalysis[]) {
  if (cvs.length === 0) {
    return {
      href: "/dashboard/cvs",
      title: "Upload your first CV",
      description:
        "Start with the source document so every workflow has real input.",
      action: "Upload CV",
    };
  }

  if (analysisCount(analyses, "CV_ANALYSIS") === 0) {
    return {
      href: "/dashboard/analyze",
      title: "Run a CV audit",
      description: "Get the first quality baseline before matching any role.",
      action: "Analyze resume",
    };
  }

  if (analysisCount(analyses, "JD_MATCH") === 0) {
    return {
      href: "/dashboard/match",
      title: "Compare against a role",
      description:
        "Use a job description to expose matched and missing signals.",
      action: "Match target role",
    };
  }

  if (analysisCount(analyses, "INTERVIEW_PREP") === 0) {
    return {
      href: "/dashboard/interview-prep",
      title: "Prepare for interviews",
      description:
        "Practice questions that connect your CV evidence to the role.",
      action: "Prepare interview",
    };
  }

  if (analysisCount(analyses, "COVER_LETTER") === 0) {
    return {
      href: "/dashboard/cover-letter",
      title: "Generate a draft",
      description:
        "Turn the CV and role context into an editable application note.",
      action: "Draft cover letter",
    };
  }

  return {
    href: "/dashboard/history",
    title: "Review saved results",
    description:
      "Check previous outputs before changing your next application.",
    action: "View history",
  };
}

function getProgressHighlights(
  cvs: CvItem[],
  analyses: CvAnalysis[],
  applications: ApplicationItem[],
) {
  const latestScore = getLatestScoreSnapshot(analyses);
  const bestMatch = getBestMatchScore(analyses);
  const statusCounts = getApplicationStatusCounts(applications);
  const activeApplications =
    statusCounts.SAVED + statusCounts.APPLIED + statusCounts.INTERVIEWING;

  return [
    {
      href: "/dashboard/progress",
      title:
        latestScore === null
          ? "No score baseline"
          : `${latestScore.value}% ${latestScore.label}`,
      detail:
        latestScore === null
          ? "Run a CV audit to start measuring quality."
          : `${analysisCount(analyses, "CV_ANALYSIS")} audit records are available.`,
      icon: TrendingUp,
    },
    {
      href: "/dashboard/match",
      title: bestMatch === null ? "No role match yet" : `${bestMatch}% best match`,
      detail:
        bestMatch === null
          ? "Paste a job description to reveal matched and missing signals."
          : `${analysisCount(analyses, "JD_MATCH")} role comparisons saved.`,
      icon: Target,
    },
    {
      href: applications.length > 0 ? "/dashboard/applications" : "/dashboard/cvs",
      title:
        statusCounts.INTERVIEWING > 0
          ? `${statusCounts.INTERVIEWING} interviewing`
          : `${activeApplications} active applications`,
      detail:
        activeApplications > 0
          ? `${statusCounts.APPLIED} applied and ${statusCounts.SAVED} saved.`
          : cvs.length > 0
            ? "Track the roles you decide to pursue."
            : "Upload a CV before tracking applications.",
      icon: BriefcaseBusiness,
    },
  ];
}

function getLatestScoreSnapshot(analyses: CvAnalysis[]) {
  const latestAnalysis = analyses.find(
    (analysis) =>
      analysis.type === "CV_ANALYSIS" &&
      (("score" in analysis.result &&
        typeof analysis.result.score === "number") ||
        ("scoringCategories" in analysis.result &&
          typeof analysis.result.scoringCategories === "object" &&
          analysis.result.scoringCategories !== null &&
          "atsReadiness" in analysis.result.scoringCategories &&
          typeof analysis.result.scoringCategories.atsReadiness === "number")),
  );

  if (!latestAnalysis) {
    return null;
  }

  if (
    "scoringCategories" in latestAnalysis.result &&
    latestAnalysis.result.scoringCategories &&
    typeof latestAnalysis.result.scoringCategories.atsReadiness === "number"
  ) {
    return {
      label: "ATS score",
      value: latestAnalysis.result.scoringCategories.atsReadiness,
    };
  }

  if (
    "score" in latestAnalysis.result &&
    typeof latestAnalysis.result.score === "number"
  ) {
    return { label: "latest score", value: latestAnalysis.result.score };
  }

  return null;
}

function getBestMatchScore(analyses: CvAnalysis[]) {
  const matchScores = analyses
    .filter((analysis) => analysis.type === "JD_MATCH")
    .map((analysis) =>
      isJdMatchResult(analysis.result) ? analysis.result.matchingScore : null,
    )
    .filter((score): score is number => typeof score === "number");

  return matchScores.length > 0 ? Math.max(...matchScores) : null;
}

function formatAnalysisScore(analysis: CvAnalysis) {
  if (isJdMatchResult(analysis.result)) {
    return `${analysis.result.matchingScore}%`;
  }

  if ("score" in analysis.result && typeof analysis.result.score === "number") {
    return `${analysis.result.score}%`;
  }

  return "";
}

function getActivitySummary(analysis: CvAnalysis) {
  const result = analysis.result;

  if (isJdMatchResult(result)) {
    const missingCount = result.missingSkills?.length ?? 0;
    return missingCount > 0
      ? `${missingCount} missing skills flagged`
      : "Role fit signals saved";
  }

  if ("suggestions" in result && Array.isArray(result.suggestions)) {
    return `${result.suggestions.length} suggestions saved`;
  }

  if ("questions" in result && Array.isArray(result.questions)) {
    return `${result.questions.length} interview prompts generated`;
  }

  if ("highlights" in result && Array.isArray(result.highlights)) {
    return `${result.highlights.length} cover letter highlights used`;
  }

  if ("draft" in result) {
    return "Follow-up draft saved";
  }

  return "Saved AI workspace output";
}
