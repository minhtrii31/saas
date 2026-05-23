"use client";

import { BriefcaseBusiness, FileText, GitCompare, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvs,
  fetchJobTargets,
  getApiErrorMessage,
  isUnauthorizedError,
  matchCv,
} from "@/components/dashboard/api";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { JobTargetSelector } from "@/components/dashboard/job-target-selector";
import { MatchResult } from "@/components/dashboard/match/match-result";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { ErrorState, LoadingSkeleton } from "@/components/dashboard/result-ui";
import { WorkflowLens } from "@/components/dashboard/workflow-lens";
import { WorkflowBrief } from "@/components/dashboard/workflow-brief";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import type { CvItem, JdMatchResult, JobTargetItem } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type MatchState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: JdMatchResult }
  | { type: "error"; message: string };

type TargetsState =
  | { type: "loading" }
  | { type: "ready"; targets: JobTargetItem[] }
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
  const [targetsState, setTargetsState] = useState<TargetsState>({
    type: "loading",
  });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [matchState, setMatchState] = useState<MatchState>({ type: "idle" });

  useEffect(() => {
    let isActive = true;

    async function loadWorkflowInputs() {
      try {
        const [cvs, targets] = await Promise.all([
          fetchCvs(token),
          fetchJobTargets(token),
        ]);

        if (!isActive) {
          return;
        }

        setCvsState({ type: "ready", cvs });
        setTargetsState({ type: "ready", targets });
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
        setTargetsState({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to load saved job targets.",
          ),
        });
      }
    }

    void loadWorkflowInputs();

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

    const trimmedJobDescriptionText = jobDescriptionText.trim();

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
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceHero
          eyebrow="Job suitability matcher"
          title="Compare the role against the real signal."
          description="Paste a job description and identify matched skills, missing evidence, and improvement opportunities."
        />
        <WorkflowLens
          title="Match lens"
          items={[
            { icon: Target, label: "Skill coverage" },
            { icon: BriefcaseBusiness, label: "Role relevance" },
            { icon: GitCompare, label: "Gap analysis" },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Setup
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Run job match
          </h3>

        {cvsState.type === "loading" ? (
          <LoadingSkeleton label="Loading documents" className="mt-5" />
        ) : null}

        {cvsState.type === "error" ? (
          <ErrorState
            title="Workspace inputs did not load"
            message={cvsState.message}
            className="mt-5"
          />
        ) : null}

        {cvsState.type === "ready" ? (
          <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
            <CvSelector
              cvs={cvsState.cvs}
              selectedCvId={selectedCvId}
              onChange={(cvId) => {
                setSelectedCvId(cvId);
                setMatchState({ type: "idle" });
              }}
            />
            {targetsState.type === "ready" ? (
              <JobTargetSelector
                targets={targetsState.targets}
                selectedTargetId={selectedTargetId}
                onChange={(targetId) => {
                  setSelectedTargetId(targetId);
                  const target = targetsState.targets.find(
                    (item) => item.id === targetId,
                  );
                  setJobDescriptionText(target?.jobDescriptionText ?? "");
                  setMatchState({ type: "idle" });
                }}
              />
            ) : null}
            {targetsState.type === "error" ? (
              <ErrorState
                title="Saved targets unavailable"
                message={targetsState.message}
              />
            ) : null}
            <div>
              <label
                htmlFor="jobDescriptionText"
                className="block text-[0.7rem] font-bold uppercase text-[#6f6f68]"
              >
                Job description
              </label>
              <textarea
                id="jobDescriptionText"
                name="jobDescriptionText"
                rows={8}
                value={jobDescriptionText}
                onChange={(event) => {
                  setJobDescriptionText(event.currentTarget.value);
                  if (selectedTargetId) {
                    setSelectedTargetId("");
                  }
                }}
                className="mt-2 block w-full border border-[#e5e5df] bg-[#f7f7f4] px-3 py-3 text-sm leading-6 text-[#171717] outline-none transition placeholder:text-[#9a9288] hover:border-[#cfcfc8] focus:border-[#171717] focus:bg-white"
                placeholder="Paste the role requirements, responsibilities, and required skills."
              />
            </div>
            <button
              type="submit"
              disabled={matchState.type === "loading" || cvsState.cvs.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a]"
            >
              <GitCompare className="h-4 w-4" aria-hidden="true" />
              {matchState.type === "loading" ? "Matching..." : "Run match"}
            </button>
          </form>
        ) : null}

        {matchState.type === "loading" ? (
          <LoadingSkeleton
            label={`Matching ${selectedCv?.title || selectedCv?.originalName || "CV"}`}
            className="mt-4"
          />
        ) : null}

        {matchState.type === "error" ? (
          <ErrorState
            title="Match stopped"
            message={matchState.message}
            className="mt-4"
          />
        ) : null}
        </div>

        <WorkflowBrief
          eyebrow="Match brief"
          icon={FileText}
          title={selectedCv?.title || selectedCv?.originalName || "No CV selected"}
          description="Paste a complete role description for better skill coverage, missing evidence, and improvement suggestions."
          listTitle="Good input includes"
          items={[
            "Responsibilities",
            "Required skills",
            "Seniority expectations",
          ]}
        />
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
