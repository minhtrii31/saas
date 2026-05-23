"use client";

import {
  CheckCircle2,
  FileText,
  Gauge,
  ListChecks,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/dashboard/result-ui";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import {
  Eyebrow,
  SectionDescription,
  SectionTitle,
} from "@/components/ui/section-heading";
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
      title="Resume Analysis"
      description="Understand how recruiters and ATS systems see your resume."
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
      <WorkspaceHero
        eyebrow="Resume review"
        title="See your resume through the first screening pass."
        description="Choose a CV, run a focused review, and get clear feedback on what reads well, what may get missed, and what to improve next."
        aside={<AiExpectations />}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <ReviewChip icon={ShieldCheck} label="ATS readiness" />
          <ReviewChip icon={Gauge} label="Recruiter clarity" />
          <ReviewChip icon={Sparkles} label="Improvement guidance" />
        </div>
      </WorkspaceHero>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Surface padding="lg" shadow>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Eyebrow>Review workflow</Eyebrow>
              <SectionTitle className="mt-1">Select CV and run analysis</SectionTitle>
              <SectionDescription className="mt-2 max-w-xl">
                Nyx uses the extracted resume text to return a score, strengths,
                weak spots, and concrete next edits.
              </SectionDescription>
            </div>
            <Link
              href="/dashboard/cvs"
              className="hidden items-center gap-1 text-xs font-semibold text-[#5f5f58] transition hover:text-[#171717] sm:inline-flex"
            >
              CV library
            </Link>
          </div>

          {cvsState.type === "loading" ? (
            <LoadingSkeleton label="Loading resumes" className="mt-5" />
          ) : null}

          {cvsState.type === "error" ? (
            <ErrorState
              title="CV library did not load"
              message={cvsState.message}
              className="mt-5"
            />
          ) : null}

          {cvsState.type === "ready" ? (
            cvsState.cvs.length > 0 ? (
              <div className="mt-5 space-y-4">
                <CvSelector
                  cvs={cvsState.cvs}
                  selectedCvId={selectedCvId}
                  onChange={(cvId) => {
                    setSelectedCvId(cvId);
                    setAnalysisState({ type: "idle" });
                  }}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    onClick={() => {
                      void handleAnalyze();
                    }}
                    disabled={analysisState.type === "loading"}
                    className="w-full sm:w-auto"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {analysisState.type === "loading"
                      ? "Reviewing resume..."
                      : "Run analysis"}
                  </Button>
                  <p className="text-xs leading-5 text-[#6f6f68]">
                    Results are saved to history so you can compare future edits.
                  </p>
                </div>
              </div>
            ) : (
              <EmptyAnalyzeState />
            )
          ) : null}

          {analysisState.type === "loading" ? (
            <LoadingSkeleton
              label={`Reviewing ${selectedCv?.title || selectedCv?.originalName || "resume"}`}
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

        <SelectedCvPanel
          selectedCv={selectedCv}
          cvCount={cvsState.type === "ready" ? cvsState.cvs.length : 0}
        />
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

function ReviewChip({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2 text-xs font-semibold text-[#343430]">
      <Icon className="h-3.5 w-3.5 text-[#3b5f58]" aria-hidden="true" />
      {label}
    </span>
  );
}

function AiExpectations() {
  const items = [
    "ATS readiness",
    "Readability",
    "Impact statements",
    "Keyword optimization",
    "Recruiter clarity",
  ];

  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717]">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#171717]">
            What Nyx reviews
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            The review looks for the signals a recruiter or screening system can
            understand quickly.
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-[#343430]">
            <CheckCircle2 className="h-4 w-4 text-[#3b5f58]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function EmptyAnalyzeState() {
  return (
    <EmptyState
      icon={FileText}
      title="Upload a resume before running analysis"
      description="Nyx reviews extracted resume text for ATS readiness, recruiter clarity, and concrete improvement opportunities."
      action={
        <Link
          href="/dashboard/cvs"
          className="inline-flex min-h-10 items-center justify-center bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926]"
        >
          Upload CV
        </Link>
      }
      className="mt-5"
    />
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
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#343430]">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
                {selectedCv.title || selectedCv.originalName}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6f6f68]">
                Uploaded {formatDateTime(selectedCv.createdAt)}
              </p>
            </div>
          </div>
          <div className="mt-5 border border-[#e5e5df] bg-white px-4 py-3">
            <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
              Extraction readiness
            </p>
            <p className="mt-2 text-sm font-semibold text-[#171717]">
              {selectedCv.extractedText
                ? "Ready for resume review"
                : "Text extraction needed before review"}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#5f5f58]">
          {cvCount === 0
            ? "Upload a CV to start a focused resume review."
            : "Choose a CV to confirm what Nyx will review."}
        </p>
      )}
    </aside>
  );
}
