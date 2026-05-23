"use client";

import {
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
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
import { SectionTitle } from "@/components/ui/section-heading";
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
  | { type: "ready"; applications: ApplicationItem[]; cvs: CvItem[]; targets: JobTargetItem[] }
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

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: "Saved",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

export default function ApplicationsPage() {
  return (
    <ProtectedPage
      title="Applications"
      description="Track roles, status, notes, and follow-up drafts."
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
  const [draft, setDraft] = useState<ApplicationFollowUpDraft | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      }
      await load();
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to delete this application."),
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
    setCopied(false);
    try {
      setDraft(await generateApplicationFollowUp(token, application.id));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setFormState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to generate follow-up draft."),
      });
    } finally {
      setGeneratingId(null);
    }
  }

  const ready = state.type === "ready" ? state : null;

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Application workflow"
        title="Track each role from saved to decision."
        description="Keep applications connected to your CVs and role targets, then generate a concise follow-up when the next step needs a nudge."
      >
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => {
              setState({ type: "loading" });
              void load();
            }}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </div>
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <ApplicationsBoard
            applications={ready.applications}
            generatingId={generatingId}
            onEdit={(application) => {
              setEditing(application);
              setFormState({ type: "idle" });
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
          />

          <div className="space-y-5">
            <ApplicationForm
              key={editing?.id ?? "new-application"}
              cvs={ready.cvs}
              targets={ready.targets}
              editing={editing}
              formState={formState}
              onSubmit={handleSubmit}
              onCancel={() => {
                setEditing(null);
                setFormState({ type: "idle" });
              }}
            />
            <FollowUpPanel
              draft={draft}
              copied={copied}
              onCopy={() => {
                if (!draft) {
                  return;
                }
                void navigator.clipboard.writeText(draft.draft);
                setCopied(true);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApplicationsBoard({
  applications,
  generatingId,
  onEdit,
  onDelete,
  onStatusChange,
  onFollowUp,
}: {
  applications: ApplicationItem[];
  generatingId: string | null;
  onEdit: (application: ApplicationItem) => void;
  onDelete: (application: ApplicationItem) => void;
  onStatusChange: (application: ApplicationItem, status: ApplicationStatus) => void;
  onFollowUp: (application: ApplicationItem) => void;
}) {
  const grouped = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        items: applications.filter((application) => application.status === status),
      })),
    [applications],
  );

  return (
    <Surface shadow>
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
        <SectionTitle className="text-sm">Pipeline</SectionTitle>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="No applications yet. Save your first role to start tracking progress."
          className="mt-5"
        />
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-5">
        {grouped.map((group) => (
          <section
            key={group.status}
            aria-label={`${statusLabels[group.status]} applications`}
            className="min-w-0 border border-[#e5e5df] bg-[#f7f7f4] p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase text-[#6f6f68]">
                {statusLabels[group.status]}
              </h2>
              <span className="font-mono text-xs text-[#6f6f68]">
                {group.items.length}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              {group.items.map((application) => (
                <article
                  key={application.id}
                  className="border border-[#e5e5df] bg-white p-3 shadow-sm shadow-zinc-950/[0.02]"
                >
                  <h3 className="truncate text-sm font-semibold text-[#171717]">
                    {application.roleTitle}
                  </h3>
                  <p className="mt-1 truncate text-xs text-[#6f6f68]">
                    {application.companyName}
                  </p>
                  <p className="mt-3 text-[11px] text-[#6f6f68]">
                    {application.appliedAt
                      ? `Applied ${formatDateTime(application.appliedAt)}`
                      : `Updated ${formatDateTime(application.updatedAt)}`}
                  </p>
                  {application.notes ? (
                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#5f5f58]">
                      {application.notes}
                    </p>
                  ) : null}
                  <FieldLabel htmlFor={`status-${application.id}`} className="mt-3">
                    Status
                  </FieldLabel>
                  <SelectInput
                    id={`status-${application.id}`}
                    value={application.status}
                    onChange={(event) =>
                      onStatusChange(
                        application,
                        event.currentTarget.value as ApplicationStatus,
                      )
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </SelectInput>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <IconButton
                      label={`Edit ${application.roleTitle}`}
                      onClick={() => onEdit(application)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Generate follow-up for ${application.roleTitle}`}
                      onClick={() => onFollowUp(application)}
                      disabled={generatingId === application.id}
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Delete ${application.roleTitle}`}
                      onClick={() => onDelete(application)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
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
    <Surface shadow>
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
        <SectionTitle className="text-sm">
          {editing ? "Edit application" : "Create application"}
        </SectionTitle>
      </div>

      <form className="mt-5 space-y-4" noValidate onSubmit={onSubmit}>
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
        <div className="grid gap-4 sm:grid-cols-2">
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
            rows={5}
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

        <div className="flex gap-2">
          <Button type="submit" disabled={formState.type === "submitting"}>
            {formState.type === "submitting" ? "Saving..." : "Save application"}
          </Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Surface>
  );
}

function FollowUpPanel({
  draft,
  copied,
  onCopy,
}: {
  draft: ApplicationFollowUpDraft | null;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <Surface shadow>
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
        <SectionTitle className="text-sm">Follow-up draft</SectionTitle>
      </div>
      {draft ? (
        <div className="mt-4">
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap border border-[#e5e5df] bg-[#f7f7f4] p-3 text-xs leading-6 text-[#171717]">
            {draft.draft}
          </pre>
          <Button className="mt-3" variant="secondary" size="sm" onClick={onCopy}>
            {copied ? (
              <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy draft"}
          </Button>
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No draft generated"
          description="Generate a follow-up from any application card when you need a concise next step."
          className="mt-4"
        />
      )}
    </Surface>
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
      className="flex h-9 items-center justify-center border border-[#e5e5df] bg-[#f7f7f4] text-[#6f6f68] transition hover:bg-white hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
