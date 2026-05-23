"use client";

import { FilePenLine, FileText, GitCompare, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvAnalyses,
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
  sortAnalysesNewestFirst,
} from "@/components/dashboard/api";
import { HistoryList } from "@/components/dashboard/history/history-list";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { LoadingSkeleton } from "@/components/dashboard/result-ui";
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
      description="Review saved analyses, job matches, and cover letters."
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
      <p
        role="alert"
        className="border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
      >
        {state.message}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceHero
          eyebrow="Workspace history"
          title="Every saved result in one trace."
          description="Review previous CV audits, job matches, and generated cover letters without losing context."
        />
        <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Review panel
          </p>
          <div className="mt-4 border border-[#e5e5df] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
              Latest result
            </p>
            {state.analyses[0] ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-[#171717]">
                  {formatAnalysisType(state.analyses[0].type)}
                </p>
                <p className="mt-1 text-xs text-[#6f6f68]">
                  {formatDateTime(state.analyses[0].createdAt)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[#5f5f58]">
                No saved outputs yet.
              </p>
            )}
          </div>
          <div className="mt-4 grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df]">
            <HistoryMetric icon={History} label="Events" value={state.analyses.length} />
            <HistoryMetric
              icon={FileText}
              label="CV audits"
              value={countByType(state.analyses, "CV_ANALYSIS")}
            />
            <HistoryMetric
              icon={GitCompare}
              label="Matches"
              value={countByType(state.analyses, "JD_MATCH")}
            />
            <HistoryMetric
              icon={FilePenLine}
              label="Letters"
              value={countByType(state.analyses, "COVER_LETTER")}
            />
          </div>
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
}: {
  icon: typeof History;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-[#ffffff] p-3">
      <span className="flex items-center gap-2 text-sm text-[#5f5f58]">
        <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-[#171717]">
        {value}
      </span>
    </div>
  );
}

function countByType(analyses: CvAnalysis[], type: CvAnalysis["type"]) {
  return analyses.filter((analysis) => analysis.type === type).length;
}
