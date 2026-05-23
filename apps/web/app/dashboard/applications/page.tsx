"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Clipboard,
  ClipboardCheck,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createApplication,
  deleteApplication,
  fetchApplications,
  fetchCvs,
  fetchJobTargets,
  generateApplicationFollowUp,
  getApiErrorMessage,
  isUnauthorizedError,
  updateApplication,
} from "@/components/dashboard/api";
import { formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/dashboard/result-ui";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import {
  FieldLabel,
  SelectInput,
  TextInput,
  Textarea,
} from "@/components/ui/form-field";
import {
  SectionDescription,
  SectionTitle,
} from "@/components/ui/section-heading";
import { StatusMessage } from "@/components/ui/status-message";
import { Surface } from "@/components/ui/surface";
import type {
  ApplicationFollowUpDraft,
  ApplicationItem,
  ApplicationStatus,
  CvItem,
  JobTargetItem,
} from "@/lib/api";

type ApplicationsState =
  | { type: "loading" }
  | {
      type: "ready";
      applications: ApplicationItem[];
      cvs: CvItem[];
      targets: JobTargetItem[];
    }
  | { type: "error"; message: string };

type FormState =
  | { type: "idle"; message?: string }
  | { type: "submitting" }
  | { type: "error"; message: string };

const statuses: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
];

const activeStatuses: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEWING",
];

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const statusAccentClassName: Record<ApplicationStatus, string> = {
  SAVED: "bg-[#cfcfc8]",
  APPLIED: "bg-[#7f8f7a]",
  INTERVIEWING: "bg-[#4f6f78]",
  OFFER: "bg-[#8a6f3d]",
  REJECTED: "bg-[#b8aaa0]",
};

export default function ApplicationsPage() {
  return (
    <ProtectedPage
      title="Applications"
      description="Track active opportunities and keep your next step visible."
    >
      {({ token }) => <ApplicationsContent token={token} />}
    </ProtectedPage>
  );
}

function ApplicationsContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<ApplicationsState>({ type: "loading" });
  const [formState, setFormState] = useState<FormState>({ type: "idle" });
  const [editing, setEditing] = useState<ApplicationItem | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, ApplicationFollowUpDraft>
  >({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }, [router]);

  const load = useCallback(async () => {
    try {
      const [applications, cvs, targets] = await Promise.all([
        fetchApplications(token),
        fetchCvs(token),
        fetchJobTargets(token),
      ]);
      setState({ type: "ready", applications, cvs, targets });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to load applications. Please try again.",
        ),
      });
    }
  }, [handleUnauthorized, token]);

  useEffect(() => {
    let isActive = true;

    async function loadInitial() {
      try {
        const [applications, cvs, targets] = await Promise.all([
          fetchApplications(token),
          fetchCvs(token),
          fetchJobTargets(token),
        ]);

        if (isActive) {
          setState({ type: "ready", applications, cvs, targets });
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
            "Unable to load applications. Please try again.",
          ),
        });
      }
    }

    void loadInitial();

    return () => {
      isActive = false;
    };
  }, [handleUnauthorized, token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const cvId = readFormText(data, "cvId");
    const companyName = readFormText(data, "companyName");
    const roleTitle = readFormText(data, "roleTitle");
    const status = readFormText(data, "status") as ApplicationStatus;
    const jobTargetId = readFormText(data, "jobTargetId");
    const appliedAt = readFormText(data, "appliedAt");
    const notes = readFormText(data, "notes");

    if (!cvId || !companyName || !roleTitle) {
      setFormState({
        type: "error",
        message: "Select a CV and add the company and role before saving.",
      });
      return;
    }

    setFormState({ type: "submitting" });

    try {
      const input = {
        cvId,
        companyName,
        roleTitle,
        status,
        ...(jobTargetId ? { jobTargetId } : {}),
        ...(appliedAt ? { appliedAt: new Date(appliedAt).toISOString() } : {}),
        ...(notes ? { notes } : {}),
      };

      if (editing) {
        await updateApplication(token, editing.id, input);
      } else {
        await createApplication(token, input);
      }

      form.reset();
      setEditing(null);
      setIsFormOpen(false);
      setFormState({
        type: "idle",
        message: editing ? "Application updated." : "Application saved.",
      });
      await load();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to save this application."),
      });
    }
  }

  async function handleDelete(application: ApplicationItem) {
    try {
      await deleteApplication(token, application.id);
      if (editing?.id === application.id) {
        setEditing(null);
        setIsFormOpen(false);
      }
      setDrafts((current) => {
        const next = { ...current };
        delete next[application.id];
        return next;
      });
      await load();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to delete this application.",
        ),
      });
    }
  }

  async function handleStatusChange(
    application: ApplicationItem,
    status: ApplicationStatus,
  ) {
    try {
      await updateApplication(token, application.id, { status });
      await load();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to update status."),
      });
    }
  }

  async function handleFollowUp(application: ApplicationItem) {
    setGeneratingId(application.id);
    setCopiedDraftId(null);
    try {
      const draft = await generateApplicationFollowUp(token, application.id);
      setDrafts((current) => ({ ...current, [application.id]: draft }));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to generate follow-up draft.",
        ),
      });
    } finally {
      setGeneratingId(null);
    }
  }

  const ready = state.type === "ready" ? state : null;

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Application workspace"
        title="Applications"
        description="Track active opportunities and keep your next step visible."
        aside={
          ready ? (
            <HeroBriefing applications={ready.applications} />
          ) : (
            <Surface tone="subtle" shadow>
              <p className="text-xs font-semibold uppercase text-[#6f6f68]">
                Focus
              </p>
              <p className="mt-3 text-sm leading-6 text-[#343430]">
                Loading your application workspace.
              </p>
            </Surface>
          )
        }
      >
        <Button
          type="button"
          onClick={() => {
            setState({ type: "loading" });
            void load();
          }}
          variant="secondary"
          size="sm"
          className="mt-6 w-fit"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </Button>
      </WorkspaceHero>

      {state.type === "loading" ? (
        <LoadingSkeleton label="Loading applications" lines={4} />
      ) : null}

      {state.type === "error" ? (
        <ErrorState
          title="Applications did not load"
          message={state.message}
          onRetry={() => {
            setState({ type: "loading" });
            void load();
          }}
        />
      ) : null}

      {ready ? (
        <>
          <OpportunityBrief applications={ready.applications} />

          <ApplicationsList
            applications={ready.applications}
            cvs={ready.cvs}
            targets={ready.targets}
            drafts={drafts}
            copiedDraftId={copiedDraftId}
            generatingId={generatingId}
            onCreate={() => {
              setEditing(null);
              setFormState({ type: "idle" });
              setIsFormOpen(true);
            }}
            onEdit={(application) => {
              setEditing(application);
              setFormState({ type: "idle" });
              setIsFormOpen(true);
            }}
            onDelete={(application) => {
              void handleDelete(application);
            }}
            onStatusChange={(application, status) => {
              void handleStatusChange(application, status);
            }}
            onFollowUp={(application) => {
              void handleFollowUp(application);
            }}
            onCopyDraft={(draft) => {
              void navigator.clipboard.writeText(draft.draft);
              setCopiedDraftId(draft.applicationId);
            }}
          />

          <ApplicationFormPanel
            isOpen={isFormOpen}
            cvs={ready.cvs}
            targets={ready.targets}
            editing={editing}
            formState={formState}
            onOpen={() => setIsFormOpen(true)}
            onSubmit={handleSubmit}
            onCancel={() => {
              setEditing(null);
              setFormState({ type: "idle" });
              setIsFormOpen(false);
            }}
          />
        </>
      ) : null}
    </div>
  );
}

function HeroBriefing({ applications }: { applications: ApplicationItem[] }) {
  const activeCount = applications.filter((application) =>
    activeStatuses.includes(application.status),
  ).length;
  const interviewingCount = applications.filter(
    (application) => application.status === "INTERVIEWING",
  ).length;
  const nextStep =
    applications.length > 0
      ? getRecommendedNextStep(applications)
      : "Create the first role to track";
  const latestApplication = getLatestApplication(applications);

  return (
    <Surface tone="subtle" shadow className="relative overflow-hidden">
      <div className="relative">
        <p className="text-xs font-semibold uppercase text-[#6f6f68]">
          Today&apos;s focus
        </p>
        <p className="mt-3 text-lg font-semibold leading-6 text-[#171717]">
          {nextStep}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <HeroMetric label="Active" value={activeCount} />
          <HeroMetric label="Interviewing" value={interviewingCount} />
        </div>
        <div className="mt-5 border-t border-[#e5e5df] pt-4">
          <p className="text-xs font-semibold uppercase text-[#6f6f68]">
            Latest touchpoint
          </p>
          <p className="mt-1 text-sm leading-6 text-[#343430]">
            {latestApplication
              ? `${latestApplication.roleTitle} at ${latestApplication.companyName}`
              : "No applications saved yet"}
          </p>
        </div>
      </div>
    </Surface>
  );
}

function OpportunityBrief({
  applications,
}: {
  applications: ApplicationItem[];
}) {
  if (applications.length === 0) {
    return null;
  }

  const activeCount = applications.filter((application) =>
    activeStatuses.includes(application.status),
  ).length;
  const interviewingCount = applications.filter(
    (application) => application.status === "INTERVIEWING",
  ).length;
  const latestApplication = getLatestApplication(applications);
  const nextStep = getRecommendedNextStep(applications);
  const offerCount = applications.filter(
    (application) => application.status === "OFFER",
  ).length;

  return (
    <Surface className="overflow-hidden" padding="none">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness
              className="h-4 w-4 text-[#6f6f68]"
              aria-hidden="true"
            />
            <SectionTitle className="text-sm">Opportunity brief</SectionTitle>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <CompactSummaryItem label="Current focus" value={nextStep} />
            <CompactSummaryItem
              label="Most recent"
              value={
                latestApplication
                  ? `${latestApplication.roleTitle} at ${latestApplication.companyName}`
                  : "None yet"
              }
            />
            <CompactSummaryItem
              label="Workspace rhythm"
              value="Review status, prepare, then follow up from the card."
            />
          </div>
        </div>
        <div className="border-t border-[#e5e5df] bg-[#f7f7f4] p-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase text-[#6f6f68]">
            Status rail
          </p>
          <div className="mt-4 space-y-2">
            <StatusPill label="Active" value={activeCount} />
            <StatusPill label="Interviewing" value={interviewingCount} />
            <StatusPill label="Offers" value={offerCount} />
          </div>
        </div>
      </div>
    </Surface>
  );
}

function ApplicationsList({
  applications,
  cvs,
  targets,
  drafts,
  copiedDraftId,
  generatingId,
  onCreate,
  onEdit,
  onDelete,
  onStatusChange,
  onFollowUp,
  onCopyDraft,
}: {
  applications: ApplicationItem[];
  cvs: CvItem[];
  targets: JobTargetItem[];
  drafts: Record<string, ApplicationFollowUpDraft>;
  copiedDraftId: string | null;
  generatingId: string | null;
  onCreate: () => void;
  onEdit: (application: ApplicationItem) => void;
  onDelete: (application: ApplicationItem) => void;
  onStatusChange: (
    application: ApplicationItem,
    status: ApplicationStatus,
  ) => void;
  onFollowUp: (application: ApplicationItem) => void;
  onCopyDraft: (draft: ApplicationFollowUpDraft) => void;
}) {
  const sortedApplications = useMemo(
    () => [...applications].sort(compareApplicationsByRecentActivity),
    [applications],
  );

  if (applications.length === 0) {
    return (
      <Surface>
        <EmptyState
          icon={BriefcaseBusiness}
          title="No applications yet"
          description="Tracking applications keeps each role connected to the CV and job target you used, so Nyx can help you see what is active, what needs attention, and when a follow-up is useful."
        />
        <Button type="button" className="mt-5" onClick={onCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create first application
        </Button>
      </Surface>
    );
  }

  return (
    <section className="space-y-3" aria-label="Applications workspace">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle>Active opportunities</SectionTitle>
          <SectionDescription className="mt-1">
            Keep the role, context, notes, and next action together.
          </SectionDescription>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onCreate}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New application
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {sortedApplications.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            cv={cvs.find((cv) => cv.id === application.cvId)}
            target={targets.find(
              (target) => target.id === application.jobTargetId,
            )}
            draft={drafts[application.id] ?? null}
            copied={copiedDraftId === application.id}
            isGenerating={generatingId === application.id}
            onEdit={() => onEdit(application)}
            onDelete={() => onDelete(application)}
            onStatusChange={(status) => onStatusChange(application, status)}
            onFollowUp={() => onFollowUp(application)}
            onCopyDraft={onCopyDraft}
          />
        ))}
      </div>
    </section>
  );
}

function ApplicationCard({
  application,
  cv,
  target,
  draft,
  copied,
  isGenerating,
  onEdit,
  onDelete,
  onStatusChange,
  onFollowUp,
  onCopyDraft,
}: {
  application: ApplicationItem;
  cv?: CvItem;
  target?: JobTargetItem;
  draft: ApplicationFollowUpDraft | null;
  copied: boolean;
  isGenerating: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  onFollowUp: () => void;
  onCopyDraft: (draft: ApplicationFollowUpDraft) => void;
}) {
  return (
    <Surface as="article" shadow padding="none" className="overflow-hidden">
      <div className={`h-1.5 ${statusAccentClassName[application.status]}`} />
      <div className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-[#171717]">
              {application.roleTitle}
            </h2>
            <p className="mt-1 truncate text-sm text-[#5f5f58]">
              {application.companyName}
            </p>
          </div>
          <span className="w-fit border border-[#d9d9d2] bg-[#f7f7f4] px-2.5 py-1 text-xs font-semibold text-[#343430]">
            {statusLabels[application.status]}
          </span>
        </div>

        <div className="grid gap-3 text-sm text-[#5f5f58] sm:grid-cols-2">
          <CardDetail
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            label="Applied"
            value={
              application.appliedAt
                ? formatDateTime(application.appliedAt)
                : "Not applied yet"
            }
          />
          <CardDetail
            icon={<FileText className="h-4 w-4" aria-hidden="true" />}
            label="Connected CV"
            value={cv?.title || cv?.originalName || "CV unavailable"}
          />
          <CardDetail
            icon={<Target className="h-4 w-4" aria-hidden="true" />}
            label="Job target"
            value={
              target
                ? `${target.title} at ${target.companyName}`
                : "No saved target"
            }
          />
          <div>
            <FieldLabel htmlFor={`status-${application.id}`}>
              Current status
            </FieldLabel>
            <SelectInput
              id={`status-${application.id}`}
              value={application.status}
              onChange={(event) =>
                onStatusChange(event.currentTarget.value as ApplicationStatus)
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>

        {application.notes ? (
          <div className="border-l-2 border-[#d9d9d2] pl-3">
            <p className="text-xs font-semibold uppercase text-[#6f6f68]">
              Notes
            </p>
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-[#343430]">
              {application.notes}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onFollowUp}
            disabled={isGenerating}
            aria-label={`Generate follow-up for ${application.roleTitle}`}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {isGenerating ? "Generating..." : "Generate follow-up"}
          </Button>
          <ActionLink
            href="/dashboard/interview-prep"
            label="Prepare interview"
          >
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
          </ActionLink>
          {target ? (
            <ActionLink href="/dashboard/job-targets" label="Open target">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
            </ActionLink>
          ) : (
            <DisabledAction label="Open target">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
            </DisabledAction>
          )}
          <IconButton label={`Edit ${application.roleTitle}`} onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
          <IconButton
            label={`Delete ${application.roleTitle}`}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </IconButton>
        </div>

        {draft ? (
          <div className="border border-[#e5e5df] bg-[#f7f7f4] p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold uppercase text-[#6f6f68]">
                Follow-up draft
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onCopyDraft(draft)}
              >
                {copied ? (
                  <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy draft"}
              </Button>
            </div>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-6 text-[#171717]">
              {draft.draft}
            </pre>
          </div>
        ) : null}
      </div>
    </Surface>
  );
}

function ApplicationFormPanel({
  isOpen,
  cvs,
  targets,
  editing,
  formState,
  onOpen,
  onSubmit,
  onCancel,
}: {
  isOpen: boolean;
  cvs: CvItem[];
  targets: JobTargetItem[];
  editing: ApplicationItem | null;
  formState: FormState;
  onOpen: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Surface>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionTitle className="text-base">New application</SectionTitle>
          <SectionDescription className="mt-1">
            Add a role when you are ready to connect it to a CV and next step.
          </SectionDescription>
        </div>
        {!isOpen ? (
          <Button type="button" variant="secondary" size="sm" onClick={onOpen}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add application
          </Button>
        ) : null}
      </div>

      {!isOpen && formState.type === "idle" && formState.message ? (
        <StatusMessage tone="success" className="mt-4">
          {formState.message}
        </StatusMessage>
      ) : null}
      {!isOpen && formState.type === "error" ? (
        <StatusMessage role="alert" tone="error" className="mt-4">
          {formState.message}
        </StatusMessage>
      ) : null}

      {isOpen ? (
        <ApplicationForm
          key={editing?.id ?? "new-application"}
          cvs={cvs}
          targets={targets}
          editing={editing}
          formState={formState}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      ) : null}
    </Surface>
  );
}

function ApplicationForm({
  cvs,
  targets,
  editing,
  formState,
  onSubmit,
  onCancel,
}: {
  cvs: CvItem[];
  targets: JobTargetItem[];
  editing: ApplicationItem | null;
  formState: FormState;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className="mt-5 space-y-4" noValidate onSubmit={onSubmit}>
      {editing ? (
        <StatusMessage>
          Editing {editing.roleTitle} at {editing.companyName}.
        </StatusMessage>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <FieldLabel htmlFor="cvId">CV</FieldLabel>
          <SelectInput id="cvId" name="cvId" defaultValue={editing?.cvId ?? ""}>
            <option value="">Select CV</option>
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.title || cv.originalName}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="jobTargetId">Job target</FieldLabel>
          <SelectInput
            id="jobTargetId"
            name="jobTargetId"
            defaultValue={editing?.jobTargetId ?? ""}
          >
            <option value="">No saved target</option>
            {targets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.title} at {target.companyName}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="companyName">Company name</FieldLabel>
          <TextInput
            id="companyName"
            name="companyName"
            defaultValue={editing?.companyName ?? ""}
          />
        </div>
        <div>
          <FieldLabel htmlFor="roleTitle">Role title</FieldLabel>
          <TextInput
            id="roleTitle"
            name="roleTitle"
            defaultValue={editing?.roleTitle ?? ""}
          />
        </div>
        <div>
          <FieldLabel htmlFor="status">Status</FieldLabel>
          <SelectInput
            id="status"
            name="status"
            defaultValue={editing?.status ?? "SAVED"}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <FieldLabel htmlFor="appliedAt">Applied date</FieldLabel>
          <TextInput
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={editing?.appliedAt?.slice(0, 10) ?? ""}
          />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="notes">Notes</FieldLabel>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={editing?.notes ?? ""}
        />
      </div>

      {formState.type === "error" ? (
        <StatusMessage role="alert" tone="error">
          {formState.message}
        </StatusMessage>
      ) : null}
      {formState.type === "idle" && formState.message ? (
        <StatusMessage tone="success">{formState.message}</StatusMessage>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={formState.type === "submitting"}>
          {formState.type === "submitting" ? "Saving..." : "Save application"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function CompactSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-[#6f6f68]">{label}</p>
      <p className="mt-1 text-sm leading-5 text-[#171717]">{value}</p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-[#e5e5df] bg-white p-3">
      <p className="text-2xl font-semibold text-[#171717]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase text-[#6f6f68]">
        {label}
      </p>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2 text-sm">
      <span className="text-[#5f5f58]">{label}</span>
      <span className="font-semibold text-[#171717]">{value}</span>
    </div>
  );
}

function CardDetail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-2">
      <span className="mt-0.5 text-[#6f6f68]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-[#6f6f68]">
          {label}
        </p>
        <p className="mt-0.5 truncate text-[#343430]">{value}</p>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#cfcfc8] bg-white px-3 text-xs font-semibold text-[#343430] transition hover:bg-[#f1f1ee]"
    >
      {children}
      {label}
    </Link>
  );
}

function DisabledAction({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-disabled="true"
      className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-3 text-xs font-semibold text-[#a1a19a]"
    >
      {children}
      {label}
    </span>
  );
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center border border-[#e5e5df] bg-[#f7f7f4] text-[#6f6f68] transition hover:bg-white hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function getLatestApplication(applications: ApplicationItem[]) {
  return [...applications].sort(compareApplicationsByRecentActivity)[0] ?? null;
}

function compareApplicationsByRecentActivity(
  first: ApplicationItem,
  second: ApplicationItem,
) {
  return getApplicationTimestamp(second) - getApplicationTimestamp(first);
}

function getApplicationTimestamp(application: ApplicationItem) {
  return new Date(
    application.appliedAt ?? application.updatedAt ?? application.createdAt,
  ).getTime();
}

function getRecommendedNextStep(applications: ApplicationItem[]) {
  const interviewing = applications.find(
    (application) => application.status === "INTERVIEWING",
  );
  if (interviewing) {
    return `Prepare for ${interviewing.companyName}`;
  }

  const applied = applications.find(
    (application) => application.status === "APPLIED",
  );
  if (applied) {
    return `Follow up with ${applied.companyName}`;
  }

  const saved = applications.find(
    (application) => application.status === "SAVED",
  );
  if (saved) {
    return `Finish ${saved.companyName} application`;
  }

  const offer = applications.find(
    (application) => application.status === "OFFER",
  );
  if (offer) {
    return `Review ${offer.companyName} offer`;
  }

  return "Choose the next role to pursue";
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
