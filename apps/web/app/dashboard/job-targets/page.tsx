"use client";

import { BookmarkCheck, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

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
import { MetricGrid, MetricTile } from "@/components/ui/metric";
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
      description="Save job descriptions for matching and cover letters."
    >
      {({ token }) => <JobTargetsContent token={token} />}
    </ProtectedPage>
  );
}

function JobTargetsContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<TargetsState>({ type: "loading" });
  const [formState, setFormState] = useState<FormState>({ type: "idle" });
  const [editingTarget, setEditingTarget] = useState<JobTargetItem | null>(null);

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

  const targets = state.type === "ready" ? state.targets : [];

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Reusable role library"
        title="Save target roles once."
        description="Keep job descriptions connected to your CV work so match checks and cover letters can start from saved context instead of repeated paste."
      >
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => {
              setState({ type: "loading" });
              void loadTargets();
            }}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </WorkspaceHero>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Surface shadow>
          <MetricGrid className="sm:grid-cols-3">
            <MetricTile
              label="Targets"
              value={state.type === "ready" ? String(targets.length) : "--"}
            />
            <MetricTile
              label="Status"
              value={state.type === "ready" ? "Synced" : "Loading"}
            />
            <MetricTile
              label="Reuse"
              value={targets.length > 0 ? "Ready" : "Manual"}
            />
          </MetricGrid>

          <div className="mt-5 flex items-center gap-2">
            <BookmarkCheck
              className="h-4 w-4 text-[#6f6f68]"
              aria-hidden="true"
            />
            <SectionTitle className="text-sm">Saved targets</SectionTitle>
          </div>

          {state.type === "loading" ? (
            <StatusMessage className="mt-5">Loading job targets...</StatusMessage>
          ) : null}

          {state.type === "error" ? (
            <StatusMessage role="alert" tone="error" className="mt-5">
              {state.message}
            </StatusMessage>
          ) : null}

          {state.type === "ready" ? (
            <TargetList
              targets={targets}
              onEdit={(target) => {
                setEditingTarget(target);
                setFormState({ type: "idle" });
              }}
              onDelete={(target) => {
                void handleDelete(target);
              }}
            />
          ) : null}
        </Surface>

        <Surface shadow>
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
            <SectionTitle className="text-sm">
              {editingTarget ? "Edit target" : "Create target"}
            </SectionTitle>
          </div>

          <form
            key={editingTarget?.id ?? "new-target"}
            className="mt-5 space-y-4"
            noValidate
            onSubmit={handleSubmit}
          >
            <div>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <TextInput
                id="title"
                name="title"
                defaultValue={editingTarget?.title}
                placeholder="Senior Backend Engineer"
              />
            </div>
            <div>
              <FieldLabel htmlFor="companyName">Company name</FieldLabel>
              <TextInput
                id="companyName"
                name="companyName"
                defaultValue={editingTarget?.companyName}
                placeholder="Acme"
              />
            </div>
            <div>
              <FieldLabel htmlFor="jobDescriptionText">
                Job description
              </FieldLabel>
              <Textarea
                id="jobDescriptionText"
                name="jobDescriptionText"
                rows={9}
                defaultValue={editingTarget?.jobDescriptionText}
                placeholder="Paste the responsibilities, requirements, and role context."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                disabled={formState.type === "submitting"}
                size="sm"
              >
                <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {formState.type === "submitting" ? "Saving..." : "Save target"}
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
      </div>
    </div>
  );
}

function TargetList({
  targets,
  onEdit,
  onDelete,
}: {
  targets: JobTargetItem[];
  onEdit: (target: JobTargetItem) => void;
  onDelete: (target: JobTargetItem) => void;
}) {
  if (targets.length === 0) {
    return (
      <div className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-6">
        <h3 className="text-sm font-semibold text-[#171717]">
          No saved targets yet
        </h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-[#5f5f58]">
          Save a target role here, then reuse it in job matching and cover
          letters without pasting the same description again.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-5 divide-y divide-[#e5e5df] border-y border-[#e5e5df]">
      {targets.map((target) => (
        <li key={target.id} className="grid gap-4 py-4 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0 px-2">
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a19a]">
              {target.companyName}
            </p>
            <h3 className="truncate text-sm font-semibold text-[#171717]">
              {target.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5f5f58]">
              {target.jobDescriptionText}
            </p>
            <p className="mt-2 text-xs text-[#6f6f68]">
              Updated {formatDateTime(target.updatedAt)}
            </p>
          </div>
          <div className="flex items-start gap-2 px-2">
            <button
              type="button"
              onClick={() => onEdit(target)}
              className="flex h-9 w-9 items-center justify-center border border-[#e5e5df] bg-white text-[#171717] transition hover:bg-[#f1f1ee]"
              aria-label={`Edit ${target.title}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(target)}
              className="flex h-9 w-9 items-center justify-center border border-[#e7d8cf] bg-[#fff7f2] text-[#8a3f24] transition hover:bg-[#ffe9dc]"
              aria-label={`Delete ${target.title}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
