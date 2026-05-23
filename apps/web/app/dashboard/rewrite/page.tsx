"use client";

import { FileText, PenLine, Sparkles, Target, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
  refineRewrite,
  rewriteResume,
} from "@/components/dashboard/api";
import { formatBytes, formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { ErrorState, LoadingSkeleton } from "@/components/dashboard/result-ui";
import { RewriteResult } from "@/components/dashboard/rewrite/rewrite-result";
import { WorkflowBrief } from "@/components/dashboard/workflow-brief";
import { WorkflowLens } from "@/components/dashboard/workflow-lens";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import { FieldLabel, SelectInput } from "@/components/ui/form-field";
import type {
  CvItem,
  ResumeRewriteGoal,
  ResumeRewriteResult,
  RewriteRefinementInstruction,
} from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type RewriteState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: ResumeRewriteResult }
  | { type: "error"; message: string };

type RefinementState = Record<
  number,
  { type: "loading" } | { type: "error"; message: string } | undefined
>;

const rewriteGoals: Array<{ value: ResumeRewriteGoal; label: string }> = [
  { value: "stronger-impact", label: "Stronger impact" },
  { value: "ats-optimization", label: "ATS optimization" },
  { value: "concise", label: "Concise" },
  { value: "quantified-achievements", label: "Quantified achievements" },
  { value: "leadership-tone", label: "Leadership tone" },
];

export default function RewritePage() {
  return (
    <ProtectedPage
      title="Rewrite"
      description="Select one uploaded CV and generate before/after rewrite suggestions."
    >
      {({ token }) => <RewriteContent token={token} />}
    </ProtectedPage>
  );
}

function RewriteContent({ token }: { token: string }) {
  const router = useRouter();
  const [cvsState, setCvsState] = useState<CvsState>({ type: "loading" });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [selectedGoal, setSelectedGoal] =
    useState<ResumeRewriteGoal>("stronger-impact");
  const [rewriteState, setRewriteState] = useState<RewriteState>({
    type: "idle",
  });
  const [refinementState, setRefinementState] = useState<RefinementState>({});

  useEffect(() => {
    let isActive = true;

    async function loadCvs() {
      try {
        const cvs = await fetchCvs(token);

        if (isActive) {
          setCvsState({ type: "ready", cvs });
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

    if (!selectedCvId) {
      setRewriteState({
        type: "error",
        message: "Select a CV before rewriting.",
      });
      return;
    }

    if (!selectedCv?.extractedText?.trim()) {
      setRewriteState({
        type: "error",
        message: "This CV does not have extracted text available for rewrite.",
      });
      return;
    }

    setRewriteState({ type: "loading" });
    setRefinementState({});

    try {
      const result = await rewriteResume(
        token,
        selectedCvId,
        selectedGoal,
        selectedCv.extractedText,
      );
      setRewriteState({ type: "success", result });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setRewriteState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to rewrite this CV. Please try again.",
        ),
      });
    }
  }

  async function handleRefine(
    suggestionIndex: number,
    instruction: RewriteRefinementInstruction,
  ) {
    if (!selectedCvId || rewriteState.type !== "success") {
      return;
    }

    const suggestion = rewriteState.result.suggestions[suggestionIndex];

    if (!suggestion) {
      return;
    }

    setRefinementState((current) => ({
      ...current,
      [suggestionIndex]: { type: "loading" },
    }));

    try {
      const refinement = await refineRewrite(token, selectedCvId, {
        original: suggestion.original,
        currentRewrite: suggestion.improved,
        instruction,
      });

      setRewriteState((current) => {
        if (current.type !== "success") {
          return current;
        }

        return {
          type: "success",
          result: {
            ...current.result,
            suggestions: current.result.suggestions.map((item, index) =>
              index === suggestionIndex
                ? {
                    ...item,
                    improved: refinement.improved,
                    reason: refinement.reason,
                  }
                : item,
            ),
          },
        };
      });
      setRefinementState((current) => ({
        ...current,
        [suggestionIndex]: undefined,
      }));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setRefinementState((current) => ({
        ...current,
        [suggestionIndex]: {
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to refine this suggestion. Please try again.",
          ),
        },
      }));
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceHero
          eyebrow="Resume rewrite workspace"
          title="Turn weak bullets into usable evidence."
          description="Select a source CV, choose a rewrite goal, and review original wording against stronger alternatives with reasons."
        />
        <WorkflowLens
          title="Rewrite lens"
          items={[
            { icon: Target, label: "Goal focused" },
            { icon: PenLine, label: "Before and after" },
            { icon: Sparkles, label: "Reasoned edits" },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Setup
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Run resume rewrite
          </h3>

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
            <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
              <div>
                <FieldLabel htmlFor="cvId">CV</FieldLabel>
                <SelectInput
                  id="cvId"
                  name="cvId"
                  value={selectedCvId}
                  onChange={(event) => {
                    setSelectedCvId(event.currentTarget.value);
                    setRewriteState({ type: "idle" });
                    setRefinementState({});
                  }}
                  disabled={cvsState.cvs.length === 0}
                >
                  <option value="">Select a CV</option>
                  {cvsState.cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.title || cv.originalName}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <div>
                <FieldLabel htmlFor="goal">Rewrite goal</FieldLabel>
                <SelectInput
                  id="goal"
                  name="goal"
                  value={selectedGoal}
                  onChange={(event) => {
                    setSelectedGoal(event.currentTarget.value as ResumeRewriteGoal);
                    setRewriteState({ type: "idle" });
                    setRefinementState({});
                  }}
                >
                  {rewriteGoals.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </SelectInput>
              </div>

              <Button
                type="submit"
                disabled={rewriteState.type === "loading"}
                className="w-full sm:w-auto"
              >
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
                {rewriteState.type === "loading" ? "Rewriting..." : "Rewrite resume"}
              </Button>
            </form>
          ) : null}

          {rewriteState.type === "loading" ? (
            <LoadingSkeleton
              label={`Rewriting ${selectedCv?.title || selectedCv?.originalName || "CV"}`}
              className="mt-4"
            />
          ) : null}

          {rewriteState.type === "error" ? (
            <ErrorState
              title="Rewrite stopped"
              message={rewriteState.message}
              className="mt-4"
            />
          ) : null}
        </div>

        <WorkflowBrief
          eyebrow="Rewrite brief"
          icon={FileText}
          title={selectedCv?.title || selectedCv?.originalName || "No CV selected"}
          description={sourceDescription(selectedCv, cvsState)}
          listTitle="Workspace shows"
          items={["Original text", "Improved text", "Reason for the change"]}
        />
      </section>

      {selectedCv ? <SelectedSource cv={selectedCv} /> : null}

      {rewriteState.type === "success" ? (
        <RewriteResult
          result={rewriteState.result}
          cvTitle={selectedCv?.title || selectedCv?.originalName || "CV"}
          refinementState={refinementState}
          onRefine={handleRefine}
        />
      ) : null}
    </div>
  );
}

function SelectedSource({ cv }: { cv: CvItem }) {
  return (
    <section className="grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] sm:grid-cols-3">
      <SourceFact label="Source" value={cv.title || cv.originalName} />
      <SourceFact label="Size" value={formatBytes(cv.sizeBytes)} />
      <SourceFact label="Uploaded" value={formatDateTime(cv.createdAt)} />
    </section>
  );
}

function SourceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white p-4">
      <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function sourceDescription(selectedCv: CvItem | undefined, cvsState: CvsState) {
  if (selectedCv) {
    return "The rewrite is generated from this uploaded CV. Choose a goal that matches the application context.";
  }

  if (cvsState.type === "ready" && cvsState.cvs.length === 0) {
    return "Upload a CV before using the rewrite workspace.";
  }

  return "Select one uploaded CV before running a rewrite.";
}
