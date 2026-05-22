"use client";

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
import { ProtectedPage } from "@/components/dashboard/protected-page";
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
    <div className="mt-8 max-w-3xl">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-950">Run analysis</h2>

        {cvsState.type === "loading" ? (
          <p role="status" className="mt-6 text-sm text-zinc-600">
            Loading CVs...
          </p>
        ) : null}

        {cvsState.type === "error" ? (
          <p
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {cvsState.message}
          </p>
        ) : null}

        {cvsState.type === "ready" ? (
          <div className="mt-6 space-y-4">
            <CvSelector
              cvs={cvsState.cvs}
              selectedCvId={selectedCvId}
              onChange={(cvId) => {
                setSelectedCvId(cvId);
                setAnalysisState({ type: "idle" });
              }}
            />
            <button
              type="button"
              onClick={() => {
                void handleAnalyze();
              }}
              disabled={analysisState.type === "loading" || cvsState.cvs.length === 0}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {analysisState.type === "loading" ? "Analyzing..." : "Analyze CV"}
            </button>
          </div>
        ) : null}

        {analysisState.type === "loading" ? (
          <p role="status" className="mt-4 text-sm text-zinc-600">
            Analyzing {selectedCv?.title || selectedCv?.originalName || "CV"}...
          </p>
        ) : null}

        {analysisState.type === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {analysisState.message}
          </p>
        ) : null}
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
