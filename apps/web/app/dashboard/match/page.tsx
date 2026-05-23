"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers3,
  SearchCheck,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
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
      title="Role Match"
      description="See how well your resume aligns with a target role."
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

    const trimmedJobDescriptionText = jobDescriptionText.trim();

    if (!trimmedJobDescriptionText) {
      setMatchState({
        type: "error",
        message: "Choose a saved target or paste a job description before checking role fit.",
      });
      return;
    }

    if (!selectedCvId) {
      setMatchState({
        type: "error",
        message: "Select a CV before checking role fit.",
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
          "Unable to check role fit. Please try again.",
        ),
      });
    }
  }

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Role targeting"
        title="Role Match"
        description="See how well your resume aligns with a target role."
        aside={<RoleFitExpectations />}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <HeroChip icon={Target}>Role fit</HeroChip>
          <HeroChip icon={BriefcaseBusiness}>Skill alignment</HeroChip>
          <HeroChip icon={SearchCheck}>Missing evidence</HeroChip>
        </div>
      </WorkspaceHero>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Target role
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#171717]">
            Choose a role and check fit
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
            Start with a saved target when you have one. It keeps the role
            context reusable across matching, cover letters, and interview prep.
          </p>

        {cvsState.type === "loading" ? (
          <LoadingSkeleton label="Loading role targeting inputs" className="mt-5" />
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
              <div className="border border-[#e5e5df] bg-[#fbfbfa] p-4">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-[#171717]">
                    Saved target
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6f6f68]">
                    Reuse a role you already saved, or leave this as manual paste
                    for a one-off comparison.
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
                    setMatchState({ type: "idle" });
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
            <div>
              <label
                htmlFor="jobDescriptionText"
                className="block text-[0.7rem] font-bold uppercase text-[#6f6f68]"
              >
                Manual job description
              </label>
              <p className="mt-2 text-xs leading-5 text-[#6f6f68]">
                Detailed job descriptions produce more accurate role fit and
                improvement insights.
              </p>
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
              <SearchCheck className="h-4 w-4" aria-hidden="true" />
              {matchState.type === "loading" ? "Checking fit..." : "Check role fit"}
            </button>
          </form>
        ) : null}

        {matchState.type === "loading" ? (
          <LoadingSkeleton
            label={`Checking ${selectedCv?.title || selectedCv?.originalName || "CV"} against the role`}
            className="mt-4"
          />
        ) : null}

        {matchState.type === "error" ? (
          <ErrorState
            title="Role fit check stopped"
            message={matchState.message}
            className="mt-4"
          />
        ) : null}
        </div>

        <RoleTargetBrief
          selectedCv={selectedCv}
          selectedTarget={selectedTarget}
          jobDescriptionText={jobDescriptionText}
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

function RoleTargetBrief({
  selectedCv,
  selectedTarget,
  jobDescriptionText,
}: {
  selectedCv?: CvItem;
  selectedTarget?: JobTargetItem;
  jobDescriptionText: string;
}) {
  const inputDepth = getInputDepth(jobDescriptionText);
  const targetTitle = selectedTarget
    ? `${selectedTarget.title} at ${selectedTarget.companyName}`
    : jobDescriptionText.trim()
      ? "Manual role context"
      : "No role selected";

  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        Target focus
      </p>
      <div className="mt-4 space-y-3">
        <FocusRow
          icon={FileText}
          label="Resume"
          value={selectedCv?.title || selectedCv?.originalName || "Choose a CV"}
        />
        <FocusRow icon={Target} label="Role" value={targetTitle} />
        <FocusRow icon={Layers3} label="Input depth" value={inputDepth.label} />
      </div>
      <div className="mt-5 border-t border-[#e5e5df] pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
          After the fit check
        </p>
        <p className="mt-3 text-sm leading-6 text-[#5f5f58]">
          Use the missing evidence list to decide whether to rewrite bullets,
          add keywords, or target a better-fit role.
        </p>
      </div>
    </aside>
  );
}

function FocusRow({
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

function getInputDepth(jobDescriptionText: string) {
  const wordCount = jobDescriptionText.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount >= 80) {
    return { label: "Detailed role context" };
  }

  if (wordCount >= 25) {
    return { label: "Usable role context" };
  }

  if (wordCount > 0) {
    return { label: "Light role context" };
  }

  return { label: "Waiting for role context" };
}

function HeroChip({
  icon: Icon,
  children,
}: {
  icon: typeof Target;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2 text-xs font-semibold text-[#343430]">
      <Icon className="h-3.5 w-3.5 text-[#3b5f58]" aria-hidden="true" />
      {children}
    </span>
  );
}

function RoleFitExpectations() {
  const items = [
    "Required skills",
    "ATS keywords",
    "Role expectations",
    "Experience signals",
    "Missing evidence",
  ];

  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717]">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#171717]">
            What Nyx compares
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            Nyx reads the target role against your resume and highlights the
            evidence a recruiter can quickly verify.
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

function NoTargetsNote() {
  return (
    <div className="mt-4 border border-dashed border-[#cfcfc8] bg-white p-4 text-sm leading-6 text-[#5f5f58]">
      <p className="font-semibold text-[#171717]">No saved targets yet</p>
      <p className="mt-1">
        Saved targets store role context once, then reuse it for role fit,
        cover letters, and interview prep.
      </p>
    </div>
  );
}
