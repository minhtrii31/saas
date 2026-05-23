"use client";

import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  SearchCheck,
  ShieldCheck,
  Target,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import { FieldLabel, SelectInput } from "@/components/ui/form-field";
import {
  Eyebrow,
  SectionDescription,
  SectionTitle,
} from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
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

const rewriteGoals: Array<{
  value: ResumeRewriteGoal;
  label: string;
  description: string;
}> = [
  {
    value: "stronger-impact",
    label: "Stronger impact",
    description: "Turn duties into evidence of scope, ownership, and outcomes.",
  },
  {
    value: "ats-optimization",
    label: "ATS optimization",
    description: "Align wording with role keywords without stuffing the bullet.",
  },
  {
    value: "concise",
    label: "Concise wording",
    description: "Keep the strongest proof while removing filler and repetition.",
  },
  {
    value: "quantified-achievements",
    label: "Quantified achievements",
    description: "Make results, scale, speed, savings, and quality gains visible.",
  },
  {
    value: "leadership-tone",
    label: "Leadership tone",
    description: "Show decision-making, cross-functional influence, and ownership.",
  },
];

const improvementSignals = [
  "Weak action verbs",
  "Vague wording",
  "Missing impact",
  "ATS keyword alignment",
  "Quantified achievements",
];

const improvementLoop = [
  { label: "Spot weak evidence", icon: SearchCheck },
  { label: "Strengthen the bullet", icon: WandSparkles },
  { label: "Explain the advantage", icon: BrainCircuit },
  { label: "Refine for the role", icon: Target },
];

export default function RewritePage() {
  return (
    <ProtectedPage
      title="Resume Improvement"
      description="Strengthen weak resume bullets into clearer, more convincing experience."
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

  const selectedGoalDetail =
    rewriteGoals.find((goal) => goal.value === selectedGoal) ?? rewriteGoals[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCvId) {
      setRewriteState({
        type: "error",
        message: "Select a resume to begin improving weak bullets and unclear experience descriptions.",
      });
      return;
    }

    if (!selectedCv?.extractedText?.trim()) {
      setRewriteState({
        type: "error",
        message: "This resume needs extracted text before Nyx can suggest improvements.",
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
          "Unable to improve this resume. Please try again.",
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
      <WorkspaceHero
        eyebrow="Resume improvement"
        title="Resume Improvement"
        description="Strengthen weak resume bullets into clearer, more convincing experience."
        aside={<ImprovementExplanation />}
      >
        <ImprovementLoop />
      </WorkspaceHero>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Surface padding="lg" shadow>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Eyebrow>Guided improvement</Eyebrow>
              <SectionTitle className="mt-1">
                Choose what should get stronger
              </SectionTitle>
              <SectionDescription className="mt-2 max-w-2xl">
                Nyx reviews the selected resume for weak bullets, unclear
                experience, and missing evidence, then suggests improvements you
                can refine.
              </SectionDescription>
            </div>
            <div className="grid grid-cols-3 overflow-hidden border border-[#e5e5df] bg-[#e5e5df] text-center">
              <SetupStat label="Source" value={selectedCv ? "Ready" : "Choose"} />
              <SetupStat label="Focus" value={selectedGoalDetail.label} />
              <SetupStat
                label="Loop"
                value={rewriteState.type === "success" ? "Refine" : "Improve"}
              />
            </div>
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
            <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit}>
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="cvId">Resume to improve</FieldLabel>
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
                      <option value="">Select a resume</option>
                      {cvsState.cvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.title || cv.originalName}
                        </option>
                      ))}
                    </SelectInput>
                  </div>

                  <div>
                    <FieldLabel htmlFor="goal">
                      Choose what you want to improve
                    </FieldLabel>
                    <SelectInput
                      id="goal"
                      name="goal"
                      value={selectedGoal}
                      onChange={(event) => {
                        setSelectedGoal(
                          event.currentTarget.value as ResumeRewriteGoal,
                        );
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
                    {rewriteState.type === "loading"
                      ? "Improving..."
                      : "Improve resume"}
                  </Button>
                </div>

                <GoalBoard
                  selectedGoal={selectedGoal}
                  onSelect={(goal) => {
                    setSelectedGoal(goal);
                    setRewriteState({ type: "idle" });
                    setRefinementState({});
                  }}
                />
              </div>
            </form>
          ) : null}

          {rewriteState.type === "loading" ? (
            <LoadingSkeleton
              label={`Improving ${selectedCv?.title || selectedCv?.originalName || "resume"}`}
              className="mt-4"
            />
          ) : null}

          {rewriteState.type === "error" ? (
            <ErrorState
              title="Improvement stopped"
              message={rewriteState.message}
              className="mt-4"
            />
          ) : null}
        </Surface>

        <ImprovementPreview selectedCv={selectedCv} cvsState={cvsState} />
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

function ImprovementLoop() {
  return (
    <div className="mt-6 grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] md:grid-cols-4">
      {improvementLoop.map((step, index) => {
        const Icon = step.icon;

        return (
          <div key={step.label} className="bg-[#fafaf8] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-white text-[#171717]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase text-[#9a9288]">
                0{index + 1}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[#343430]">
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SetupStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-[#fafaf8] px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function GoalBoard({
  selectedGoal,
  onSelect,
}: {
  selectedGoal: ResumeRewriteGoal;
  onSelect: (goal: ResumeRewriteGoal) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rewriteGoals.map((goal) => {
        const isSelected = selectedGoal === goal.value;

        return (
          <button
            key={goal.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(goal.value)}
            className={`min-h-28 border p-4 text-left transition ${
              isSelected
                ? "border-[#171717] bg-[#171717] text-white"
                : "border-[#e5e5df] bg-[#fafaf8] text-[#343430] hover:border-[#cfcfc8] hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center border ${
                  isSelected
                    ? "border-white/25 bg-white/10"
                    : "border-[#e5e5df] bg-white"
                }`}
              >
                <Target
                  className={`h-3.5 w-3.5 ${
                    isSelected ? "text-white" : "text-[#6f6f68]"
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span className="text-sm font-semibold">{goal.label}</span>
            </div>
            <p
              className={`mt-3 text-sm leading-6 ${
                isSelected ? "text-white/80" : "text-[#5f5f58]"
              }`}
            >
              {goal.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function ImprovementExplanation() {
  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-[#171717]">
          <SearchCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Improvement scan
          </p>
          <p className="mt-1 text-sm leading-5 text-[#343430]">
            Finds weak evidence and turns it into recruiter-ready proof.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#343430]">
        {improvementSignals.map((signal) => (
          <li
            key={signal}
            className="flex min-h-9 items-center gap-2 border border-[#e5e5df] bg-white px-2"
          >
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-[#6f6f68]"
              aria-hidden="true"
            />
            <span className="min-w-0 leading-4">{signal}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 border border-[#e5e5df] bg-white p-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#6f6f68]">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Improvement target
        </div>
        <p className="mt-2 text-sm leading-5 text-[#343430]">
          Action, scope, result, and keyword fit.
        </p>
      </div>
    </aside>
  );
}

function ImprovementPreview({
  selectedCv,
  cvsState,
}: {
  selectedCv: CvItem | undefined;
  cvsState: CvsState;
}) {
  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <Eyebrow>Improvement expectations</Eyebrow>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#171717]">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
            {selectedCv?.title || selectedCv?.originalName || "No resume selected"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            {sourceDescription(selectedCv, cvsState)}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <PreviewStep
          icon={ClipboardCheck}
          title="Original wording"
          description="The bullet or phrase that weakens the resume signal."
        />
        <PreviewStep
          icon={ShieldCheck}
          title="Stronger rewrite"
          description="A clearer version with stronger impact and role fit."
        />
        <PreviewStep
          icon={BrainCircuit}
          title="Recruiter clarity"
          description="Why the change makes the experience easier to trust."
        />
      </div>
    </aside>
  );
}

function PreviewStep({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="border border-[#e5e5df] bg-white p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
        <p className="text-sm font-semibold text-[#171717]">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#5f5f58]">{description}</p>
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
    return "Nyx will use this resume as the source and focus each suggestion on the improvement goal you choose.";
  }

  if (cvsState.type === "ready" && cvsState.cvs.length === 0) {
    return "Upload a resume to begin improving weak bullets and unclear experience descriptions.";
  }

  return "Select a resume to begin improving weak bullets and unclear experience descriptions.";
}
