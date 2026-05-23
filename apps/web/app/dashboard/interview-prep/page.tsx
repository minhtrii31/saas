"use client";

import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquareText,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
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
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/dashboard/result-ui";
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
      description="Practice the questions recruiters are most likely to ask from your resume and target role."
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
        setSelectedTargetId((current) => current || targets[0]?.id || "");
        setJobDescriptionText(
          (current) => current || targets[0]?.jobDescriptionText || "",
        );
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

  const selectedTarget = useMemo(() => {
    return targetsState.type === "ready"
      ? targetsState.targets.find((target) => target.id === selectedTargetId)
      : undefined;
  }, [selectedTargetId, targetsState]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCvId) {
      setInterviewPrepState({
        type: "error",
        message: "Select a CV before starting interview practice.",
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
          "Unable to prepare interview coaching. Please try again.",
        ),
      });
    }
  }

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Interview coaching"
        title="Practice the questions your resume invites."
        description="Practice the questions recruiters are most likely to ask from your resume and target role."
        aside={<CoachingSources />}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <HeroChip icon={MessageSquareText}>Likely questions</HeroChip>
          <HeroChip icon={Target}>Role expectations</HeroChip>
          <HeroChip icon={BrainCircuit}>Weak-area practice</HeroChip>
        </div>
      </WorkspaceHero>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Coaching setup
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Prepare for a target role
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
            Start with a saved target when possible. Nyx uses the role and your
            resume evidence to shape questions, answer direction, and weak-point
            practice.
          </p>

          {cvsState.type === "loading" ? (
            <LoadingSkeleton label="Loading coaching inputs" className="mt-5" />
          ) : null}

          {cvsState.type === "error" ? (
            <ErrorState
              title="Workspace inputs did not load"
              message={cvsState.message}
              className="mt-5"
            />
          ) : null}

          {cvsState.type === "ready" ? (
            cvsState.cvs.length > 0 ? (
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
                  <div className="border border-[#e5e5df] bg-[#fbfbfa] p-4">
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-[#171717]">
                        Saved target
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6f6f68]">
                        Reuse a saved role for more specific coaching, or use
                        manual role context for one-off practice.
                      </p>
                    </div>
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
                    {targetsState.targets.length === 0 ? <NoTargetsNote /> : null}
                  </div>
                ) : null}
                {targetsState.type === "error" ? (
                  <ErrorState
                    title="Saved targets unavailable"
                    message={targetsState.message}
                  />
                ) : null}
                <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)]">
                  <div>
                    <FieldLabel htmlFor="interviewFocus">
                      Interview focus
                    </FieldLabel>
                    <SelectInput
                      id="interviewFocus"
                      name="interviewFocus"
                      value={interviewFocus}
                      onChange={(event) => {
                        setInterviewFocus(
                          event.currentTarget.value as InterviewFocus,
                        );
                        setInterviewPrepState({ type: "idle" });
                      }}
                    >
                      <option value="mixed">Mixed</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="technical">Technical</option>
                    </SelectInput>
                  </div>
                  <FocusGuide focus={interviewFocus} />
                </div>
                <div>
                  <FieldLabel htmlFor="jobDescriptionText">
                    Manual role context
                  </FieldLabel>
                  <p className="mt-2 text-xs leading-5 text-[#6f6f68]">
                    Manual context is useful when the role is not saved yet.
                    More detail creates more targeted recruiter and technical
                    questions.
                  </p>
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
                    placeholder="Paste a job description or role notes when you want more role-specific practice."
                  />
                </div>
                <button
                  type="submit"
                  disabled={interviewPrepState.type === "loading"}
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a]"
                >
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  {interviewPrepState.type === "loading"
                    ? "Preparing coaching..."
                    : "Start practice session"}
                </button>
              </form>
            ) : (
              <EmptyInterviewPrepState />
            )
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
            <ErrorState
              title="Interview coaching stopped"
              message={interviewPrepState.message}
              className="mt-4"
            />
          ) : null}
        </div>

        <PrepSessionBrief
          selectedCv={selectedCv}
          selectedTarget={selectedTarget}
          jobDescriptionText={jobDescriptionText}
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

function HeroChip({
  icon: Icon,
  children,
}: {
  icon: typeof MessageSquareText;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2 text-xs font-semibold text-[#343430]">
      <Icon className="h-3.5 w-3.5 text-[#3b5f58]" aria-hidden="true" />
      {children}
    </span>
  );
}

function CoachingSources() {
  const items = [
    "Your resume evidence",
    "Target role expectations",
    "Weak skill areas",
    "Missing experience signals",
  ];

  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#171717]">
            Personalized coaching from
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            Nyx turns your resume and role context into practice prompts with
            reasons and answer direction.
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

function FocusGuide({ focus }: { focus: InterviewFocus }) {
  const guide = {
    behavioral:
      "Behavioral practice focuses on ownership, conflict, decision-making, and examples recruiters can probe.",
    technical:
      "Technical practice focuses on systems, tools, implementation choices, and weak skill areas.",
    mixed:
      "Mixed combines recruiter and technical questioning.",
  }[focus];

  return (
    <div className="border border-[#e5e5df] bg-[#fbfbfa] p-4 text-sm leading-6 text-[#5f5f58]">
      {guide}
    </div>
  );
}

function PrepSessionBrief({
  selectedCv,
  selectedTarget,
  jobDescriptionText,
}: {
  selectedCv?: CvItem;
  selectedTarget?: JobTargetItem;
  jobDescriptionText: string;
}) {
  const roleLabel = selectedTarget
    ? `${selectedTarget.title} at ${selectedTarget.companyName}`
    : jobDescriptionText.trim()
      ? "Manual role context"
      : "Resume-led practice";

  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        Prep session
      </p>
      <div className="mt-4 space-y-3">
        <BriefRow
          icon={FileText}
          label="Resume"
          value={selectedCv?.title || selectedCv?.originalName || "Choose a CV"}
        />
        <BriefRow icon={Target} label="Role" value={roleLabel} />
      </div>
      <div className="mt-5 border-t border-[#e5e5df] pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
          Your prep session includes
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5f5f58]">
          <li>Likely interview questions</li>
          <li>Why each question matters</li>
          <li>Answer direction</li>
          <li>STAR guidance</li>
          <li>Weak-point coaching</li>
        </ul>
      </div>
    </aside>
  );
}

function BriefRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 border border-[#e5e5df] bg-white p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f7f7f4] text-[#171717]">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
          {value}
        </p>
      </div>
    </div>
  );
}

function NoTargetsNote() {
  return (
    <div className="mt-4 border border-dashed border-[#cfcfc8] bg-white p-4 text-sm leading-6 text-[#5f5f58]">
      <p className="font-semibold text-[#171717]">No saved targets yet</p>
      <p className="mt-1">
        Saved targets let you reuse role context across interview prep,
        matching, and cover letters.
      </p>
    </div>
  );
}

function EmptyInterviewPrepState() {
  return (
    <EmptyState
      icon={FileText}
      title="Upload a resume before interview coaching"
      description="Nyx uses resume evidence to generate likely questions, answer direction, and weak-point practice."
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
