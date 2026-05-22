"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
  matchCv,
} from "@/components/dashboard/api";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { MatchResult } from "@/components/dashboard/match/match-result";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import type { CvItem, JdMatchResult } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type MatchState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: JdMatchResult }
  | { type: "error"; message: string };

export default function MatchPage() {
  return (
    <ProtectedPage
      title="Match Job"
      description="Select one CV, paste a job description, and compare fit."
    >
      {({ token }) => <MatchContent token={token} />}
    </ProtectedPage>
  );
}

function MatchContent({ token }: { token: string }) {
  const router = useRouter();
  const [cvsState, setCvsState] = useState<CvsState>({ type: "loading" });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [matchState, setMatchState] = useState<MatchState>({ type: "idle" });

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const jobDescriptionText = formData.get("jobDescriptionText");
    const trimmedJobDescriptionText =
      typeof jobDescriptionText === "string" ? jobDescriptionText.trim() : "";

    if (!trimmedJobDescriptionText) {
      setMatchState({
        type: "error",
        message: "Enter a job description before matching.",
      });
      return;
    }

    if (!selectedCvId) {
      setMatchState({
        type: "error",
        message: "Select a CV before matching.",
      });
      return;
    }

    setMatchState({ type: "loading" });

    try {
      const result = await matchCv(token, selectedCvId, trimmedJobDescriptionText);
      setMatchState({ type: "success", result });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setMatchState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to match this CV. Please try again.",
        ),
      });
    }
  }

  return (
    <div className="mt-8 max-w-3xl">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-950">Run match</h2>

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
          <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
            <CvSelector
              cvs={cvsState.cvs}
              selectedCvId={selectedCvId}
              onChange={(cvId) => {
                setSelectedCvId(cvId);
                setMatchState({ type: "idle" });
              }}
            />
            <div>
              <label
                htmlFor="jobDescriptionText"
                className="block text-sm font-medium text-zinc-800"
              >
                Job description
              </label>
              <textarea
                id="jobDescriptionText"
                name="jobDescriptionText"
                rows={8}
                className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                placeholder="Paste the role requirements, responsibilities, and required skills."
              />
            </div>
            <button
              type="submit"
              disabled={matchState.type === "loading" || cvsState.cvs.length === 0}
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {matchState.type === "loading" ? "Matching..." : "Run match"}
            </button>
          </form>
        ) : null}

        {matchState.type === "loading" ? (
          <p role="status" className="mt-4 text-sm text-zinc-600">
            Matching {selectedCv?.title || selectedCv?.originalName || "CV"}...
          </p>
        ) : null}

        {matchState.type === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {matchState.message}
          </p>
        ) : null}
      </section>

      {matchState.type === "success" ? (
        <MatchResult
          result={matchState.result}
          cvTitle={selectedCv?.title || selectedCv?.originalName || "CV"}
        />
      ) : null}
    </div>
  );
}
