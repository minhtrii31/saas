"use client";

import {
  ArrowUpRight,
  FileText,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  analyzeCv,
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { AnalysisResult } from "@/components/dashboard/analysis/analysis-result";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { formatBytes, formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { ErrorState, LoadingSkeleton } from "@/components/dashboard/result-ui";
import { WorkflowLens } from "@/components/dashboard/workflow-lens";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import { MetricGrid, MetricTile } from "@/components/ui/metric";
import { Eyebrow, SectionTitle } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import type { CvAnalysisResult, CvItem } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type AnalysisState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: CvAnalysisResult }
  | { type: "error"; message: string };

export default function AnalyzePage() {
  return (
    <ProtectedPage
      title="Analyze CV"
      description="Select one uploaded CV and run a quality analysis."
    >
      {({ token }) => <AnalyzeContent token={token} />}
    </ProtectedPage>
  );
}

function AnalyzeContent({ token }: { token: string }) {
  const router = useRouter();
  const [cvsState, setCvsState] = useState<CvsState>({ type: "loading" });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    type: "idle",
  });

  useEffect(() => {
    let isActive = true;

    async function loadCvs() {
      try {
        const cvs = await fetchCvs(token);

        if (!isActive) {
          return;
        }

        setCvsState({ type: "ready", cvs });
        setSelectedCvId((current) => current || cvs[0]?.id || "");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }

        setCvsState({
          type: "error",
          message: getApiErrorMessage(error, "Unable to load CVs. Please try again."),
        });
      }
    }

    void loadCvs();

    return () => {
      isActive = false;
    };
  }, [router, token]);

  const selectedCv = useMemo(() => {
    return cvsState.type === "ready"
      ? cvsState.cvs.find((cv) => cv.id === selectedCvId)
      : undefined;
  }, [cvsState, selectedCvId]);

  async function handleAnalyze() {
    if (!selectedCvId) {
      setAnalysisState({
        type: "error",
        message: "Select a CV before analyzing.",
      });
      return;
    }

    setAnalysisState({ type: "loading" });

    try {
      const result = await analyzeCv(token, selectedCvId);
      setAnalysisState({ type: "success", result });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setAnalysisState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to analyze CV. Please try again."),
      });
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceHero
          eyebrow="AI audit workspace"
          title="Find the signal before a recruiter does."
          description="Select a source CV and generate a structured quality report: strengths, weak spots, and practical improvements."
        />
        <WorkflowLens
          title="Audit lens"
          items={[
            { icon: ShieldCheck, label: "Recruiter clarity" },
            { icon: Gauge, label: "Quality signal" },
            { icon: Sparkles, label: "Improvement guidance" },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Surface padding="lg" shadow>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Setup</Eyebrow>
              <SectionTitle className="mt-1">Run CV analysis</SectionTitle>
            </div>
            <Link
              href="/dashboard/cvs"
              className="hidden items-center gap-1 text-xs font-semibold text-[#5f5f58] transition hover:text-[#171717] sm:inline-flex"
            >
              Repository
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

        {cvsState.type === "loading" ? (
          <LoadingSkeleton label="Loading documents" className="mt-5" />
        ) : null}

        {cvsState.type === "error" ? (
          <ErrorState
            title="CV library did not load"
            message={cvsState.message}
            className="mt-5"
          />
        ) : null}

        {cvsState.type === "ready" ? (
          <div className="mt-5 space-y-4">
            <CvSelector
              cvs={cvsState.cvs}
              selectedCvId={selectedCvId}
              onChange={(cvId) => {
                setSelectedCvId(cvId);
                setAnalysisState({ type: "idle" });
              }}
            />
            <Button
              onClick={() => {
                void handleAnalyze();
              }}
              disabled={analysisState.type === "loading" || cvsState.cvs.length === 0}
              className="w-full sm:w-auto"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {analysisState.type === "loading" ? "Analyzing..." : "Analyze CV"}
            </Button>
          </div>
        ) : null}

        {analysisState.type === "loading" ? (
          <LoadingSkeleton
            label={`Analyzing ${selectedCv?.title || selectedCv?.originalName || "CV"}`}
            className="mt-4"
          />
        ) : null}

        {analysisState.type === "error" ? (
          <ErrorState
            title="Analysis stopped"
            message={analysisState.message}
            className="mt-4"
            onRetry={selectedCvId ? () => void handleAnalyze() : undefined}
          />
        ) : null}
        </Surface>

        <SelectedCvPanel selectedCv={selectedCv} cvCount={cvsState.type === "ready" ? cvsState.cvs.length : 0} />
      </section>

      {analysisState.type === "success" ? (
        <AnalysisResult
          result={analysisState.result}
          cvTitle={selectedCv?.title || selectedCv?.originalName || "CV"}
        />
      ) : null}
    </div>
  );
}

function SelectedCvPanel({
  selectedCv,
  cvCount,
}: {
  selectedCv?: CvItem;
  cvCount: number;
}) {
  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <Eyebrow>Selected source</Eyebrow>
      {selectedCv ? (
        <div className="mt-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f1f1ee] text-[#343430]">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
                {selectedCv.title || selectedCv.originalName}
              </p>
              <p className="mt-1 break-all text-xs leading-5 text-[#6f6f68]">
                {selectedCv.originalName}
              </p>
            </div>
          </div>
          <MetricGrid className="mt-5">
            <SourceMetric label="Size" value={formatBytes(selectedCv.sizeBytes)} />
            <SourceMetric label="Uploaded" value={formatDateTime(selectedCv.createdAt)} />
          </MetricGrid>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#5f5f58]">
          {cvCount === 0
            ? "No source documents are available yet."
            : "Choose a CV to preview the source details."}
        </p>
      )}
    </aside>
  );
}

function SourceMetric({ label, value }: { label: string; value: string }) {
  return <MetricTile label={label} value={value} className="p-3" />;
}
