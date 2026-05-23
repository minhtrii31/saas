"use client";

import {
  BriefcaseBusiness,
  Building2,
  ClipboardPenLine,
  FilePenLine,
  FileText,
  MessagesSquare,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvs,
  fetchJobTargets,
  generateCoverLetter,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { CoverLetterResultPanel } from "@/components/dashboard/cover-letter/cover-letter-result";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { JobTargetSelector } from "@/components/dashboard/job-target-selector";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { LoadingSkeleton } from "@/components/dashboard/result-ui";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import {
  FieldLabel,
  SelectInput,
  TextInput,
  Textarea,
} from "@/components/ui/form-field";
import {
  Eyebrow,
  SectionDescription,
  SectionTitle,
} from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";
import type { CoverLetterResult, CvItem, JobTargetItem } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type CoverLetterState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: CoverLetterResult; copied: boolean }
  | { type: "error"; message: string };

type TargetsState =
  | { type: "loading" }
  | { type: "ready"; targets: JobTargetItem[] }
  | { type: "error"; message: string };

export default function CoverLetterPage() {
  return (
    <ProtectedPage
      title="Cover Letter"
      description="Create a tailored cover letter from your resume and target role."
    >
      {({ token }) => <CoverLetterContent token={token} />}
    </ProtectedPage>
  );
}

function CoverLetterContent({ token }: { token: string }) {
  const router = useRouter();
  const [cvsState, setCvsState] = useState<CvsState>({ type: "loading" });
  const [targetsState, setTargetsState] = useState<TargetsState>({
    type: "loading",
  });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [jobDescriptionText, setJobDescriptionText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [coverLetterState, setCoverLetterState] = useState<CoverLetterState>({
    type: "idle",
  });

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
          message: getApiErrorMessage(
            error,
            "Unable to load CVs. Please try again.",
          ),
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

    const formData = new FormData(event.currentTarget);
    const tone = formData.get("tone");
    const trimmedJobDescriptionText = jobDescriptionText.trim();
    const trimmedCompanyName = companyName.trim();
    const trimmedRoleTitle = roleTitle.trim();
    const trimmedTone = typeof tone === "string" ? tone.trim() : "";

    if (!trimmedJobDescriptionText) {
      setCoverLetterState({
        type: "error",
        message:
          "Add a saved target or paste role context before creating a draft.",
      });
      return;
    }

    if (!selectedCvId) {
      setCoverLetterState({
        type: "error",
        message:
          "Upload or select a resume before creating a cover letter draft.",
      });
      return;
    }

    setCoverLetterState({ type: "loading" });

    try {
      const result = await generateCoverLetter(token, selectedCvId, {
        jobDescriptionText: trimmedJobDescriptionText,
        ...(trimmedCompanyName ? { companyName: trimmedCompanyName } : {}),
        ...(trimmedRoleTitle ? { roleTitle: trimmedRoleTitle } : {}),
        ...(trimmedTone ? { tone: trimmedTone } : {}),
      });

      setCoverLetterState({ type: "success", result, copied: false });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setCoverLetterState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to create this cover letter draft. Please try again.",
        ),
      });
    }
  }

  async function handleCopy() {
    if (coverLetterState.type !== "success") {
      return;
    }

    if (!navigator.clipboard) {
      setCoverLetterState({
        type: "error",
        message: "Copy is not available in this browser.",
      });
      return;
    }

    await navigator.clipboard.writeText(coverLetterState.result.coverLetter);
    setCoverLetterState({ ...coverLetterState, copied: true });
  }

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Application drafting"
        title="Cover Letter"
        description="Create a tailored cover letter from your resume and target role."
        aside={<TailoringExplanation />}
      >
        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#6f6f68]">
          <StoryChip icon={UserRound} label="Resume evidence" />
          <StoryChip icon={BriefcaseBusiness} label="Target role" />
          <StoryChip icon={Building2} label="Company context" />
          <StoryChip icon={MessagesSquare} label="Editable draft" />
        </div>
      </WorkspaceHero>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Surface padding="lg" shadow>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Eyebrow>Application draft</Eyebrow>
              <SectionTitle className="mt-1">
                Start from a saved target
              </SectionTitle>
              <SectionDescription className="mt-2 max-w-2xl">
                Saved targets carry the role, company, and job context Nyx needs
                to tailor your story. Manual paste is available when the role is
                not saved yet.
              </SectionDescription>
            </div>
            <DraftStatus
              selectedCv={selectedCv}
              selectedTarget={selectedTarget}
              hasManualContext={Boolean(jobDescriptionText.trim())}
            />
          </div>

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
            cvsState.cvs.length > 0 ? (
              <form
                className="mt-6 space-y-5"
                noValidate
                onSubmit={handleSubmit}
              >
                <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                  <div>
                    <CvSelector
                      cvs={cvsState.cvs}
                      selectedCvId={selectedCvId}
                      onChange={(cvId) => {
                        setSelectedCvId(cvId);
                        setCoverLetterState({ type: "idle" });
                      }}
                    />
                  </div>
                  <div>
                    {targetsState.type === "ready" ? (
                      <JobTargetSelector
                        targets={targetsState.targets}
                        selectedTargetId={selectedTargetId}
                        onChange={(targetId) => {
                          setSelectedTargetId(targetId);
                          const target = targetsState.targets.find(
                            (item) => item.id === targetId,
                          );
                          setJobDescriptionText(
                            target?.jobDescriptionText ?? "",
                          );
                          setCompanyName(target?.companyName ?? "");
                          setRoleTitle(target?.title ?? "");
                          setCoverLetterState({ type: "idle" });
                        }}
                      />
                    ) : null}
                  </div>
                </div>
                {targetsState.type === "error" ? (
                  <p
                    role="alert"
                    className="border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
                  >
                    {targetsState.message}
                  </p>
                ) : null}
                <div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <FieldLabel htmlFor="jobDescriptionText">
                      Manual role context
                    </FieldLabel>
                    <p className="text-xs leading-5 text-[#6f6f68]">
                      Use when the target is not saved. Specific context
                      improves personalization.
                    </p>
                  </div>
                  <Textarea
                    id="jobDescriptionText"
                    name="jobDescriptionText"
                    rows={8}
                    required
                    value={jobDescriptionText}
                    onChange={(event) => {
                      setJobDescriptionText(event.currentTarget.value);
                      if (selectedTargetId) {
                        setSelectedTargetId("");
                      }
                    }}
                    placeholder="Paste the role requirements, responsibilities, and required skills."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="companyName"
                    label="Company name"
                    placeholder="Optional"
                    value={companyName}
                    onChange={(value) => setCompanyName(value)}
                  />
                  <TextField
                    id="roleTitle"
                    label="Role title"
                    placeholder="Optional"
                    value={roleTitle}
                    onChange={(value) => setRoleTitle(value)}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="tone">
                    Choose application tone
                  </FieldLabel>
                  <SelectInput
                    id="tone"
                    name="tone"
                    defaultValue="professional"
                  >
                    <option value="professional">Professional</option>
                    <option value="confident">Confident</option>
                    <option value="concise">Concise</option>
                    <option value="warm">Warm</option>
                  </SelectInput>
                  <p className="mt-2 text-xs leading-5 text-[#6f6f68]">
                    Choose a tone that matches the company and role.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={
                    coverLetterState.type === "loading" ||
                    cvsState.cvs.length === 0
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a]"
                >
                  <FilePenLine className="h-4 w-4" aria-hidden="true" />
                  {coverLetterState.type === "loading"
                    ? "Drafting..."
                    : "Create draft"}
                </button>
              </form>
            ) : (
              <EmptyCoverLetterState />
            )
          ) : null}

          {coverLetterState.type === "loading" ? (
            <LoadingSkeleton
              label={`Creating a tailored draft for ${
                selectedCv?.title || selectedCv?.originalName || "CV"
              }`}
              className="mt-4"
            />
          ) : null}

          {coverLetterState.type === "error" ? (
            <p
              role="alert"
              className="mt-4 border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
            >
              {coverLetterState.message}
            </p>
          ) : null}
        </Surface>

        <DraftBrief selectedCv={selectedCv} selectedTarget={selectedTarget} />
      </section>

      {coverLetterState.type === "success" ? (
        <CoverLetterResultPanel
          result={coverLetterState.result}
          cvTitle={selectedCv?.title || selectedCv?.originalName || "CV"}
          copied={coverLetterState.copied}
          onCopy={() => {
            void handleCopy();
          }}
        />
      ) : null}
    </div>
  );
}

function TextField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <TextInput
        id={id}
        name={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

function TailoringExplanation() {
  const inputs = [
    "Resume experience",
    "Target role requirements",
    "Company context",
    "Recruiter expectations",
  ];

  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-[#6f6f68]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            How Nyx tailors
          </p>
          <p className="mt-1 text-sm leading-5 text-[#343430]">
            Nyx connects your evidence to what the role is asking for.
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {inputs.map((input) => (
          <p key={input} className="text-sm leading-5 text-[#5f5f58]">
            {input}
          </p>
        ))}
      </div>
    </aside>
  );
}

function StoryChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2 text-xs font-semibold text-[#343430]">
      <Icon className="h-3.5 w-3.5 text-[#6f6f68]" aria-hidden="true" />
      {label}
    </span>
  );
}

function DraftStatus({
  selectedCv,
  selectedTarget,
  hasManualContext,
}: {
  selectedCv: CvItem | undefined;
  selectedTarget: JobTargetItem | undefined;
  hasManualContext: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-px border border-[#e5e5df] bg-[#e5e5df] text-center">
      <StatusCell label="Resume" value={selectedCv ? "Ready" : "Needed"} />
      <StatusCell
        label="Target"
        value={
          selectedTarget ? "Saved" : hasManualContext ? "Manual" : "Needed"
        }
      />
      <StatusCell label="Draft" value="Editable" />
    </div>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-white px-3 py-2">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p className="mt-1 truncate text-xs font-semibold text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function EmptyCoverLetterState() {
  return (
    <div className="mt-6 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#171717]">
          <FileText className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-[#171717]">
            Upload a resume to start tailored drafting
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            Nyx needs resume evidence before it can connect your experience to a
            target role and create a useful starting draft.
          </p>
          <Link
            href="/dashboard/cvs"
            className="mt-4 inline-flex min-h-10 items-center justify-center bg-[#171717] px-3 text-sm font-semibold text-white transition hover:bg-[#2b2926]"
          >
            Upload resume
          </Link>
        </div>
      </div>
    </div>
  );
}

function DraftBrief({
  selectedCv,
  selectedTarget,
}: {
  selectedCv: CvItem | undefined;
  selectedTarget: JobTargetItem | undefined;
}) {
  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <Eyebrow>Draft expectations</Eyebrow>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#6f6f68]">
          <ClipboardPenLine className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
            {selectedTarget
              ? `${selectedTarget.title} at ${selectedTarget.companyName}`
              : "Target role not selected"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            {selectedCv
              ? "Nyx will use your selected resume as the evidence base and the role context to shape the application story."
              : "Select a resume so Nyx can ground the draft in your actual experience."}
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3 border-t border-[#e5e5df] pt-4">
        <BriefItem
          title="Personalized narrative"
          description="Connects your relevant experience to the target role."
        />
        <BriefItem
          title="Role-specific emphasis"
          description="Uses company and requirement context when available."
        />
        <BriefItem
          title="Collaborative draft"
          description="Designed as a starting draft you can edit before sending."
        />
      </div>
    </aside>
  );
}

function BriefItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#171717]">{title}</p>
      <p className="mt-1 text-sm leading-5 text-[#5f5f58]">{description}</p>
    </div>
  );
}
