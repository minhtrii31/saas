"use client";

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
      <p role="status" className="mt-8 text-sm text-zinc-600">
        Loading analysis history...
      </p>
    );
  }

  if (state.type === "error") {
    return (
      <p
        role="alert"
        className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {state.message}
      </p>
    );
  }

  return <HistoryList analyses={state.analyses} cvsById={cvsById} />;
}
