"use client";

import { FilePenLine, FileText, PenLine, ScrollText } from "lucide-react";
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
import { WorkflowLens } from "@/components/dashboard/workflow-lens";
import { WorkflowBrief } from "@/components/dashboard/workflow-brief";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import {
  FieldLabel,
  SelectInput,
  TextInput,
  Textarea,
} from "@/components/ui/form-field";
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
      description="Select one CV and generate a tailored cover letter draft."
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
  const [coverLetterState, setCoverLetterState] =
    useState<CoverLetterState>({ type: "idle" });

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

    const formData = new FormData(event.currentTarget);
    const tone = formData.get("tone");
    const trimmedJobDescriptionText = jobDescriptionText.trim();
    const trimmedCompanyName = companyName.trim();
    const trimmedRoleTitle = roleTitle.trim();
    const trimmedTone = typeof tone === "string" ? tone.trim() : "";

    if (!trimmedJobDescriptionText) {
      setCoverLetterState({
        type: "error",
        message: "Enter a job description before generating a cover letter.",
      });
      return;
    }

    if (!selectedCvId) {
      setCoverLetterState({
        type: "error",
        message: "Select a CV before generating a cover letter.",
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
          "Unable to generate a cover letter. Please try again.",
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
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <WorkspaceHero
          eyebrow="Cover letter studio"
          title="Turn fit into a focused application note."
          description="Combine a saved CV with a target role to create a draft you can copy, edit, and send with control."
        />
        <WorkflowLens
          title="Draft structure"
          items={[
            { icon: ScrollText, label: "Role context" },
            { icon: PenLine, label: "Tailored narrative" },
            { icon: FilePenLine, label: "Editable output" },
          ]}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Setup
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Generate draft
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
                setCoverLetterState({ type: "idle" });
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
                  setCompanyName(target?.companyName ?? "");
                  setRoleTitle(target?.title ?? "");
                  setCoverLetterState({ type: "idle" });
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
              <FieldLabel htmlFor="jobDescriptionText">
                Job description
              </FieldLabel>
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
              <FieldLabel htmlFor="tone">Tone</FieldLabel>
              <SelectInput id="tone" name="tone" defaultValue="professional">
                <option value="professional">Professional</option>
                <option value="confident">Confident</option>
                <option value="concise">Concise</option>
                <option value="warm">Warm</option>
              </SelectInput>
            </div>
            <button
              type="submit"
              disabled={
                coverLetterState.type === "loading" || cvsState.cvs.length === 0
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a]"
            >
              <FilePenLine className="h-4 w-4" aria-hidden="true" />
              {coverLetterState.type === "loading" ? "Generating..." : "Generate"}
            </button>
          </form>
        ) : null}

        {coverLetterState.type === "loading" ? (
          <LoadingSkeleton
            label={`Generating a cover letter for ${
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
        </div>

        <WorkflowBrief
          eyebrow="Draft brief"
          icon={FileText}
          title={selectedCv?.title || selectedCv?.originalName || "No CV selected"}
          description="Add a company name, role title, and tone when you know them. The draft stays easier to edit when the inputs are specific."
          listTitle="Best result when"
          items={[
            "The JD is pasted in full",
            "The role title is exact",
            "The tone matches the company",
          ]}
        />
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
      <FieldLabel htmlFor={id}>
        {label}
      </FieldLabel>
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
