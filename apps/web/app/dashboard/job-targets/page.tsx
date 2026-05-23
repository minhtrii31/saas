"use client";

import {
  BookmarkCheck,
  BriefcaseBusiness,
  FileText,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  createJobTarget,
  deleteJobTarget,
  fetchJobTargets,
  getApiErrorMessage,
  isUnauthorizedError,
  updateJobTarget,
} from "@/components/dashboard/api";
import { formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextInput, Textarea } from "@/components/ui/form-field";
import { SectionTitle } from "@/components/ui/section-heading";
import { StatusMessage } from "@/components/ui/status-message";
import { Surface } from "@/components/ui/surface";
import type { JobTargetItem } from "@/lib/api";

type TargetsState =
  | { type: "loading" }
  | { type: "ready"; targets: JobTargetItem[] }
  | { type: "error"; message: string };

type FormState =
  | { type: "idle"; message?: string }
  | { type: "submitting" }
  | { type: "error"; message: string };

export default function JobTargetsPage() {
  return (
    <ProtectedPage
      title="Job Targets"
      description="Save roles once, then reuse them for matching, cover letters, and interview prep."
    >
      {({ token }) => <JobTargetsContent token={token} />}
    </ProtectedPage>
  );
}

function JobTargetsContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<TargetsState>({ type: "loading" });
  const [formState, setFormState] = useState<FormState>({ type: "idle" });
  const [editingTarget, setEditingTarget] = useState<JobTargetItem | null>(
    null,
  );
  const [showAllTargets, setShowAllTargets] = useState(false);
  const [selectedCurrentTargetId, setSelectedCurrentTargetId] = useState<
    string | null
  >(null);
  const formSectionRef = useRef<HTMLElement | null>(null);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }, [router]);

  const loadTargets = useCallback(async () => {
    try {
      const targets = await fetchJobTargets(token);
      setState({ type: "ready", targets });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to load job targets. Please try again.",
        ),
      });
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    let isActive = true;

    async function loadInitialTargets() {
      try {
        const targets = await fetchJobTargets(token);

        if (isActive) {
          setState({ type: "ready", targets });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          handleUnauthorized();
          return;
        }

        setState({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to load job targets. Please try again.",
          ),
        });
      }
    }

    void loadInitialTargets();

    return () => {
      isActive = false;
    };
  }, [handleUnauthorized, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = readFormText(formData, "title");
    const companyName = readFormText(formData, "companyName");
    const jobDescriptionText = readFormText(formData, "jobDescriptionText");

    if (!title || !companyName || !jobDescriptionText) {
      setFormState({
        type: "error",
        message: "Add a title, company, and job description before saving.",
      });
      return;
    }

    setFormState({ type: "submitting" });

    try {
      if (editingTarget) {
        await updateJobTarget(token, editingTarget.id, {
          title,
          companyName,
          jobDescriptionText,
        });
      } else {
        await createJobTarget(token, {
          title,
          companyName,
          jobDescriptionText,
        });
      }

      form.reset();
      setEditingTarget(null);
      setFormState({
        type: "idle",
        message: editingTarget ? "Target updated." : "Target saved.",
      });
      await loadTargets();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to save this job target."),
      });
    }
  }

  async function handleDelete(target: JobTargetItem) {
    setFormState({ type: "idle" });

    try {
      await deleteJobTarget(token, target.id);
      if (editingTarget?.id === target.id) {
        setEditingTarget(null);
      }
      await loadTargets();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to delete this job target."),
      });
    }
  }

  const targets = useMemo(() => {
    if (state.type !== "ready") {
      return [];
    }

    return [...state.targets].sort(
      (first, second) => getTargetTimestamp(second) - getTargetTimestamp(first),
    );
  }, [state]);
  const currentTarget =
    targets.find((target) => target.id === selectedCurrentTargetId) ??
    targets[0];
  const visibleTargets = showAllTargets ? targets : targets.slice(0, 5);

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Target role workspace"
        title="Build a role dossier."
        description="Save the job context once, then let every CV match, cover letter, and interview session start from the same source of truth."
        aside={
          <TargetDossierAside targets={targets} currentTarget={currentTarget} />
        }
      >
        <Button
          type="button"
          onClick={() => {
            setState({ type: "loading" });
            void loadTargets();
          }}
          variant="secondary"
          size="sm"
          className="mt-6"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </Button>
      </WorkspaceHero>

      {state.type === "loading" ? (
        <StatusMessage>Loading job targets...</StatusMessage>
      ) : null}

      {state.type === "error" ? (
        <StatusMessage role="alert" tone="error">
          {state.message}
        </StatusMessage>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3 xl:items-start">
        {currentTarget ? (
          <CurrentTarget
            className="xl:col-span-2"
            target={currentTarget}
            onEdit={(target) => {
              setEditingTarget(target);
              setFormState({ type: "idle" });
              formSectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          />
        ) : null}

        {state.type === "ready" ? (
          <TargetSignalStrip targets={targets} />
        ) : null}

        <section
          id="create-target-role"
          ref={formSectionRef}
          className="xl:col-start-3 xl:row-span-3 xl:row-start-1 xl:h-full"
        >
          <Surface tone="subtle" shadow className="xl:h-fit">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Plus
                    className="h-3.5 w-3.5 text-[#8f8f87]"
                    aria-hidden="true"
                  />
                  <SectionTitle className="text-sm font-semibold text-[#343430]">
                    Capture station
                  </SectionTitle>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#6f6f68]">
                  Paste the full JD for stronger matching, cover letters, and
                  interview prep.
                </p>
              </div>
              <span className="border border-[#e5e5df] bg-white px-2 py-1 text-[10px] font-semibold uppercase text-[#6f6f68] text-center">
                {editingTarget ? "Edit" : "Create"}
              </span>
            </div>

            <form
              key={editingTarget?.id ?? "new-target"}
              className="mt-4 space-y-3"
              noValidate
              onSubmit={handleSubmit}
            >
              <div>
                <FieldLabel htmlFor="title" className="text-[0.65rem]">
                  Role title
                </FieldLabel>
                <TextInput
                  id="title"
                  name="title"
                  defaultValue={editingTarget?.title}
                  placeholder="Senior Backend Engineer"
                  className="h-10 bg-white"
                />
              </div>
              <div>
                <FieldLabel htmlFor="companyName" className="text-[0.65rem]">
                  Company name
                </FieldLabel>
                <TextInput
                  id="companyName"
                  name="companyName"
                  defaultValue={editingTarget?.companyName}
                  placeholder="Acme"
                  className="h-10 bg-white"
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="jobDescriptionText"
                  className="text-[0.65rem]"
                >
                  Job description
                </FieldLabel>
                <Textarea
                  id="jobDescriptionText"
                  name="jobDescriptionText"
                  rows={7}
                  defaultValue={editingTarget?.jobDescriptionText}
                  placeholder="Paste the responsibilities, requirements, and role context."
                  className="bg-white"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={formState.type === "submitting"}
                  variant={editingTarget ? "secondary" : "primary"}
                  size="sm"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {formState.type === "submitting"
                    ? "Saving..."
                    : "Save target"}
                </Button>
                {editingTarget ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingTarget(null);
                      setFormState({ type: "idle" });
                    }}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>

            {formState.type === "error" ? (
              <StatusMessage role="alert" tone="error" className="mt-4">
                {formState.message}
              </StatusMessage>
            ) : null}
            {formState.type === "idle" && formState.message ? (
              <StatusMessage tone="success" className="mt-4">
                {formState.message}
              </StatusMessage>
            ) : null}
          </Surface>
        </section>

        {state.type === "ready" ? (
          <Surface shadow className="xl:col-span-2" padding="none">
            <div className="border-b border-[#e5e5df] bg-[#f7f7f4] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookmarkCheck
                    className="h-4 w-4 text-[#6f6f68]"
                    aria-hidden="true"
                  />
                  <SectionTitle className="text-sm">Saved targets</SectionTitle>
                </div>
                {targets.length > 5 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllTargets((current) => !current)}
                  >
                    {showAllTargets ? "Show latest 5" : "Show all targets"}
                  </Button>
                ) : null}
              </div>
            </div>

            <TargetList
              targets={visibleTargets}
              currentTargetId={currentTarget?.id ?? null}
              onSelectCurrent={setSelectedCurrentTargetId}
              onCreate={() => {
                formSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              onEdit={(target) => {
                setEditingTarget(target);
                setFormState({ type: "idle" });
                formSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              onDelete={(target) => {
                void handleDelete(target);
              }}
            />
          </Surface>
        ) : null}
      </div>
    </div>
  );
}

function TargetDossierAside({
  targets,
  currentTarget,
}: {
  targets: JobTargetItem[];
  currentTarget?: JobTargetItem;
}) {
  return (
    <Surface tone="subtle" shadow className="relative overflow-hidden">
      <div className="relative">
        <p className="text-xs font-semibold uppercase text-[#6f6f68]">
          Target dossier
        </p>
        <p className="mt-3 text-lg font-semibold leading-6 text-[#171717]">
          {currentTarget
            ? `${currentTarget.title} at ${currentTarget.companyName}`
            : "No target selected yet"}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <DossierMetric label="Saved targets" value={targets.length} />
          <DossierMetric
            label="Ready workflows"
            value={currentTarget ? 3 : 0}
          />
        </div>
        <div className="mt-5 border-t border-[#e5e5df] pt-4">
          <p className="text-xs font-semibold uppercase text-[#6f6f68]">
            Next reuse
          </p>
          <p className="mt-1 text-sm leading-6 text-[#343430]">
            {currentTarget
              ? "Match a CV, draft a letter, or prep for the interview."
              : "Capture a role to unlock job-specific workflows."}
          </p>
        </div>
      </div>
    </Surface>
  );
}

function TargetSignalStrip({ targets }: { targets: JobTargetItem[] }) {
  return (
    <Surface padding="none" className="overflow-hidden xl:col-span-2" shadow>
      <div className="grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="border-b border-[#e5e5df] bg-[#f7f7f4] p-5 md:border-b-0 md:border-r">
          <p className="text-xs font-semibold uppercase text-[#6f6f68]">
            Saved targets
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#171717]">
            {targets.length}
          </p>
          <p className="mt-3 text-xs leading-5 text-[#6f6f68]">
            Latest updated:{" "}
            {targets[0] ? formatDateTime(targets[0].updatedAt) : "None yet"}
          </p>
        </div>
        <div className="grid gap-0 sm:grid-cols-3">
          <WorkflowTile
            href="/dashboard/match"
            label="Match"
            description="Compare fit against an uploaded CV."
            icon={<BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />}
          />
          <WorkflowTile
            href="/dashboard/cover-letter"
            label="Letter"
            description="Start from the same role context."
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
          />
          <WorkflowTile
            href="/dashboard/interview-prep"
            label="Interview"
            description="Turn requirements into practice."
            icon={<MessageSquareText className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      </div>
    </Surface>
  );
}

function TargetList({
  targets,
  currentTargetId,
  onSelectCurrent,
  onCreate,
  onEdit,
  onDelete,
}: {
  targets: JobTargetItem[];
  currentTargetId: string | null;
  onSelectCurrent: (targetId: string) => void;
  onCreate: () => void;
  onEdit: (target: JobTargetItem) => void;
  onDelete: (target: JobTargetItem) => void;
}) {
  if (targets.length === 0) {
    return (
      <div className="mt-5 border-y border-[#e5e5df] px-2 py-6">
        <h2 className="text-base font-semibold text-[#171717]">
          No saved targets yet
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f5f58]">
          Save a target role once and Nyx can reuse the JD for matching, cover
          letters, and interview prep without repeated pasting.
        </p>
        <Button type="button" className="mt-5" size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Create your first target
        </Button>
      </div>
    );
  }

  return (
    <ul className="px-5 divide-y divide-[#e5e5df]">
      {targets.map((target) => {
        const isCurrent = target.id === currentTargetId;

        return (
          <li
            key={target.id}
            className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="min-w-0 px-2">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a19a]">
                  {target.companyName}
                </p>
                {isCurrent ? (
                  <span className="border border-[#e5e5df] bg-[#fbfbf9] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#6f6f68]">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="truncate text-sm font-semibold text-[#171717]">
                {target.title}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5f5f58]">
                {target.jobDescriptionText}
              </p>
              <p className="mt-2 text-xs text-[#6f6f68]">
                {getTargetDateLabel(target)}
              </p>
            </div>
            <div className="flex flex-wrap items-start gap-2 px-2 lg:max-w-[26rem] lg:justify-end">
              {isCurrent ? (
                <button
                  type="button"
                  onClick={() => onDelete(target)}
                  className={dangerIconButtonClassName}
                  aria-label={`Delete ${target.title}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <>
                  <WorkflowAction
                    href="/dashboard/match"
                    label="Match"
                    icon={
                      <BriefcaseBusiness
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    }
                  />
                  <WorkflowAction
                    href="/dashboard/cover-letter"
                    label="Cover letter"
                    icon={<FileText className="h-4 w-4" aria-hidden="true" />}
                  />
                  <WorkflowAction
                    href="/dashboard/interview-prep"
                    label="Interview prep"
                    icon={
                      <MessageSquareText
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    }
                  />
                  <button
                    type="button"
                    onClick={() => onSelectCurrent(target.id)}
                    className={
                      subtleActionClassName +
                      "inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#e5e5df] bg-white px-3 text-xs font-semibold text-[#343430] transition hover:bg-[#f7f7f4] sm:w-auto"
                    }
                  >
                    <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Select current
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(target)}
                    className={iconButtonClassName}
                    aria-label={`Edit ${target.title}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(target)}
                    className={dangerIconButtonClassName}
                    aria-label={`Delete ${target.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function CurrentTarget({
  className = "",
  target,
  onEdit,
}: {
  className?: string;
  target: JobTargetItem;
  onEdit: (target: JobTargetItem) => void;
}) {
  return (
    <Surface shadow padding="none" className={`overflow-hidden ${className}`}>
      <div className="border-b border-[#e5e5df] bg-[#f7f7f4] px-5 py-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Current target
          </p>
        </div>
      </div>
      <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-[#171717]">
            {target.title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#5f5f58]">
            {target.companyName}
          </p>
          <div className="mt-5 border-l-2 border-[#cfcfc8] pl-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[#6f6f68]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Reusable context
            </p>
            <p className="line-clamp-4 max-w-3xl text-sm leading-6 text-[#343430]">
              {target.jobDescriptionText}
            </p>
          </div>
          <p className="mt-3 text-xs text-[#6f6f68]">
            {getTargetDateLabel(target)}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2 lg:max-w-64 lg:justify-end">
          <WorkflowAction
            href="/dashboard/match"
            label="Match with CV"
            icon={<BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />}
            primary
          />
          <WorkflowAction
            href="/dashboard/cover-letter"
            label="Generate cover letter"
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
          />
          <WorkflowAction
            href="/dashboard/interview-prep"
            label="Prepare interview"
            icon={<MessageSquareText className="h-4 w-4" aria-hidden="true" />}
          />
          <button
            type="button"
            onClick={() => onEdit(target)}
            className={secondaryActionClassName}
            aria-label={`Edit ${target.title}`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
        </div>
      </div>
    </Surface>
  );
}

function DossierMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#e5e5df] bg-white p-3">
      <p className="text-2xl font-semibold text-[#171717]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-[#6f6f68]">
        {label}
      </p>
    </div>
  );
}

function WorkflowTile({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group border-b border-[#e5e5df] p-5 transition hover:bg-[#f7f7f4] sm:border-b-0 sm:border-r sm:last:border-r-0"
    >
      <span className="flex h-9 w-9 items-center justify-center border border-[#e5e5df] bg-white text-[#5f5f58] transition group-hover:text-[#171717]">
        {icon}
      </span>
      <p className="mt-4 text-sm font-semibold text-[#171717]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[#6f6f68]">{description}</p>
    </Link>
  );
}

function WorkflowAction({
  href,
  label,
  icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={primary ? primaryActionClassName : secondaryActionClassName}
    >
      {icon}
      {label}
    </Link>
  );
}

const primaryActionClassName =
  "inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#343430] bg-[#343430] px-3 text-xs font-semibold text-white transition hover:bg-[#171717] sm:w-auto";

const secondaryActionClassName =
  "inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#e5e5df] bg-white px-3 text-xs font-semibold text-[#343430] transition hover:bg-[#f7f7f4] sm:w-auto";

const subtleActionClassName =
  "inline-flex min-h-9 w-full items-center justify-center gap-2 border border-[#e5e5df] bg-[#fbfbf9] px-3 text-xs font-semibold text-[#5f5f58] transition hover:bg-[#f1f1ee] sm:w-auto";

const iconButtonClassName =
  "flex h-9 w-9 items-center justify-center border border-[#e5e5df] bg-white text-[#5f5f58] transition hover:bg-[#f7f7f4] hover:text-[#171717]";

const dangerIconButtonClassName =
  "flex h-9 w-9 items-center justify-center border border-[#eaded8] bg-white text-[#8a5a46] transition hover:bg-[#fff7f2] hover:text-[#8a3f24]";

function getTargetTimestamp(target: JobTargetItem) {
  return new Date(target.updatedAt || target.createdAt).getTime();
}

function getTargetDateLabel(target: JobTargetItem) {
  const changedAt = target.updatedAt || target.createdAt;
  const prefix = target.updatedAt === target.createdAt ? "Created" : "Updated";

  return `${prefix} ${formatDateTime(changedAt)}`;
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
