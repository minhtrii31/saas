"use client";

import {
  BrainCircuit,
  ClipboardList,
  FileText,
  MessageSquareText,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvs,
  fetchJobTargets,
  generateInterviewPrep,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { InterviewPrepResultPanel } from "@/components/dashboard/interview-prep/interview-prep-result";
import { JobTargetSelector } from "@/components/dashboard/job-target-selector";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { LoadingSkeleton } from "@/components/dashboard/result-ui";
import { WorkflowBrief } from "@/components/dashboard/workflow-brief";
import { WorkflowLens } from "@/components/dashboard/workflow-lens";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { FieldLabel, SelectInput, Textarea } from "@/components/ui/form-field";
import type {
  CvItem,
  InterviewFocus,
  InterviewPrepResult,
  JobTargetItem,
} from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type TargetsState =
  | { type: "loading" }
  | { type: "ready"; targets: JobTargetItem[] }
  | { type: "error"; message: string };

type InterviewPrepState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: InterviewPrepResult }
  | { type: "error"; message: string };

export default function InterviewPrepPage() {
  return (
    <ProtectedPage
      title="Interview Prep"
      description="Select one CV and generate a focused interview practice set."
    >
      {({ token }) => <InterviewPrepContent token={token} />}
    </ProtectedPage>
  );
}

function InterviewPrepContent({ token }: { token: string }) {
  const router = useRouter();
  const [cvsState, setCvsState] = useState<CvsState>({ type: "loading" });
  const [targetsState, setTargetsState] = useState<TargetsState>({
    type: "loading",
  });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [interviewFocus, setInterviewFocus] =
    useState<InterviewFocus>("mixed");
  const [interviewPrepState, setInterviewPrepState] =
    useState<InterviewPrepState>({ type: "idle" });

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

    if (!selectedCvId) {
      setInterviewPrepState({
        type: "error",
        message: "Select a CV before generating interview prep.",
      });
      return;
    }

    setInterviewPrepState({ type: "loading" });

    try {
      const trimmedJobDescriptionText = jobDescriptionText.trim();
      const result = await generateInterviewPrep(token, selectedCvId, {
        interviewFocus,
        ...(selectedTargetId ? { jobTargetId: selectedTargetId } : {}),
        ...(trimmedJobDescriptionText
          ? { jobDescriptionText: trimmedJobDescriptionText }
          : {}),
      });

      setInterviewPrepState({ type: "success", result });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setInterviewPrepState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to generate interview prep. Please try again.",
        ),
      });
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceHero
          eyebrow="Interview prep workspace"
          title="Practice the questions your CV invites."
          description="Turn your CV and target role into a structured coaching plan with question prompts, answer direction, STAR notes, and weak-point practice."
        />
        <WorkflowLens
          title="Coach lens"
          items={[
            { icon: MessageSquareText, label: "Question practice" },
            { icon: Target, label: "Role signal" },
            { icon: BrainCircuit, label: "Weak points" },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Setup
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Generate practice set
          </h3>

          {cvsState.type === "loading" ? (
            <LoadingSkeleton label="Loading documents" className="mt-5" />
          ) : null}

          {cvsState.type === "error" ? (
            <p
              role="alert"
              className="mt-5 border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
            >
              {cvsState.message}
            </p>
          ) : null}

          {cvsState.type === "ready" ? (
            <form className="mt-5 space-y-4" noValidate onSubmit={handleSubmit}>
              <CvSelector
                cvs={cvsState.cvs}
                selectedCvId={selectedCvId}
                onChange={(cvId) => {
                  setSelectedCvId(cvId);
                  setInterviewPrepState({ type: "idle" });
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
                    setInterviewPrepState({ type: "idle" });
                  }}
                />
              ) : null}
              {targetsState.type === "error" ? (
                <p
                  role="alert"
                  className="border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
                >
                  {targetsState.message}
                </p>
              ) : null}
              <div>
                <FieldLabel htmlFor="interviewFocus">
                  Interview focus
                </FieldLabel>
                <SelectInput
                  id="interviewFocus"
                  name="interviewFocus"
                  value={interviewFocus}
                  onChange={(event) => {
                    setInterviewFocus(event.currentTarget.value as InterviewFocus);
                    setInterviewPrepState({ type: "idle" });
                  }}
                >
                  <option value="mixed">Mixed</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                </SelectInput>
              </div>
              <div>
                <FieldLabel htmlFor="jobDescriptionText">
                  Role context
                </FieldLabel>
                <Textarea
                  id="jobDescriptionText"
                  name="jobDescriptionText"
                  rows={7}
                  value={jobDescriptionText}
                  onChange={(event) => {
                    setJobDescriptionText(event.currentTarget.value);
                    if (selectedTargetId) {
                      setSelectedTargetId("");
                    }
                    setInterviewPrepState({ type: "idle" });
                  }}
                  placeholder="Optional: paste a job description to make the practice set more role-specific."
                />
              </div>
              <button
                type="submit"
                disabled={
                  interviewPrepState.type === "loading" ||
                  cvsState.cvs.length === 0
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a]"
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
                {interviewPrepState.type === "loading"
                  ? "Generating..."
                  : "Generate prep"}
              </button>
            </form>
          ) : null}

          {interviewPrepState.type === "loading" ? (
            <LoadingSkeleton
              label={`Preparing interview practice for ${
                selectedCv?.title || selectedCv?.originalName || "CV"
              }`}
              className="mt-4"
            />
          ) : null}

          {interviewPrepState.type === "error" ? (
            <p
              role="alert"
              className="mt-4 border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
            >
              {interviewPrepState.message}
            </p>
          ) : null}
        </div>

        <WorkflowBrief
          eyebrow="Coach brief"
          icon={FileText}
          title={selectedCv?.title || selectedCv?.originalName || "No CV selected"}
          description="Use role context when you have it. Without a target role, Nyx builds practice around the strongest and weakest CV evidence."
          listTitle="Prep output covers"
          items={[
            "Interview questions",
            "Why each question matters",
            "Answer direction",
            "STAR guidance where useful",
          ]}
        />
      </section>

      {interviewPrepState.type === "success" ? (
        <InterviewPrepResultPanel
          result={interviewPrepState.result}
          cvTitle={selectedCv?.title || selectedCv?.originalName || "CV"}
        />
      ) : null}
    </div>
  );
}
