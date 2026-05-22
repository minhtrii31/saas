"use client";

import { FileText, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { CvList } from "@/components/dashboard/cvs/cv-list";
import { CvUploadForm } from "@/components/dashboard/cvs/cv-upload-form";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";
import { Button } from "@/components/ui/button";
import { MetricGrid, MetricTile } from "@/components/ui/metric";
import { SectionTitle } from "@/components/ui/section-heading";
import { StatusMessage } from "@/components/ui/status-message";
import { Surface } from "@/components/ui/surface";
import type { CvItem } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

export default function CvsPage() {
  return (
    <ProtectedPage
      title="CVs"
      description="Upload CV files and manage your saved CV library."
    >
      {({ token }) => <CvsContent token={token} />}
    </ProtectedPage>
  );
}

function CvsContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<CvsState>({ type: "loading" });

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }, [router]);

  async function loadCvs() {
    try {
      const cvs = await fetchCvs(token);
      setState({ type: "ready", cvs });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to load CVs. Please try again."),
      });
    }
  }

  async function handleRefresh() {
    setState({ type: "loading" });
    await loadCvs();
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialCvs() {
      try {
        const cvs = await fetchCvs(token);

        if (isActive) {
          setState({ type: "ready", cvs });
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
            "Unable to load CVs. Please try again.",
          ),
        });
      }
    }

    void loadInitialCvs();

    return () => {
      isActive = false;
    };
  }, [handleUnauthorized, token]);

  const totalSize =
    state.type === "ready"
      ? state.cvs.reduce((total, cv) => total + cv.sizeBytes, 0)
      : 0;

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Document repository"
        title="Your CV source library."
        description="Keep the raw documents here. Every analysis, match, and cover letter starts from one reliable source file."
      >
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => {
              void handleRefresh();
            }}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </WorkspaceHero>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Surface shadow>
          <MetricGrid className="sm:grid-cols-3">
            <MetricTile
              label="Documents"
              value={state.type === "ready" ? String(state.cvs.length) : "--"}
            />
            <MetricTile
              label="Storage"
              value={state.type === "ready" ? formatStorage(totalSize) : "--"}
            />
            <MetricTile
              label="Status"
              value={state.type === "ready" ? "Synced" : "Loading"}
            />
          </MetricGrid>

          <div className="mt-5 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
            <SectionTitle className="text-sm">Saved documents</SectionTitle>
          </div>

          {state.type === "loading" ? (
            <StatusMessage className="mt-5">Loading CVs...</StatusMessage>
          ) : null}

          {state.type === "error" ? (
            <StatusMessage role="alert" tone="error" className="mt-5">
              {state.message}
            </StatusMessage>
          ) : null}

          {state.type === "ready" ? <CvList cvs={state.cvs} /> : null}
        </Surface>

        <CvUploadForm
          token={token}
          onUploaded={loadCvs}
          onUnauthorized={handleUnauthorized}
        />
      </div>
    </div>
  );
}

function formatStorage(bytes: number) {
  if (bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}
