"use client";

import { ArrowUpRight, FileText, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";
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
import { SectionDescription, SectionTitle } from "@/components/ui/section-heading";
import { StatusMessage } from "@/components/ui/status-message";
import { Surface } from "@/components/ui/surface";
import type { CvItem } from "@/lib/api";
import { formatBytes, formatDateTime } from "@/components/dashboard/format";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

export default function CvsPage() {
  return (
    <ProtectedPage
      title="CV Library"
      description="Upload, review, and choose the source documents Nyx uses for analysis."
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

  const cvs = state.type === "ready" ? sortByLatest(state.cvs) : [];
  const currentCv = cvs[0];
  const totalSize = cvs.reduce((total, cv) => total + cv.sizeBytes, 0);
  const latestUploadDate = currentCv ? formatDateTime(currentCv.createdAt) : "None";

  return (
    <div className="space-y-5">
      <WorkspaceHero
        eyebrow="Source library"
        title="CV Library"
        description="Upload, review, and choose the source documents Nyx uses for analysis."
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <CvUploadForm
          token={token}
          onUploaded={loadCvs}
          onUnauthorized={handleUnauthorized}
        />

        <Surface shadow>
          <MetricGrid className="sm:grid-cols-3 xl:grid-cols-1">
            <MetricTile
              label="Total documents"
              value={state.type === "ready" ? String(cvs.length) : "--"}
            />
            <MetricTile
              label="Latest upload"
              value={state.type === "ready" ? latestUploadDate : "--"}
            />
            <MetricTile
              label="Total storage"
              value={state.type === "ready" ? formatBytes(totalSize) : "--"}
            />
          </MetricGrid>
        </Surface>
      </div>

      {state.type === "loading" ? (
        <StatusMessage>Loading CVs...</StatusMessage>
      ) : null}

      {state.type === "error" ? (
        <StatusMessage role="alert" tone="error">
          {state.message}
        </StatusMessage>
      ) : null}

      {state.type === "ready" ? (
        <>
          <CurrentSourceCard cv={currentCv} />

          <Surface shadow>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
                  <SectionTitle className="text-sm">Documents</SectionTitle>
                </div>
                <SectionDescription className="mt-2 max-w-2xl">
                  Recent CV sources are shown first. Older versions stay available
                  without crowding the workspace.
                </SectionDescription>
              </div>
            </div>

            <CvList cvs={cvs} />
          </Surface>
        </>
      ) : null}
    </div>
  );
}

function CurrentSourceCard({ cv }: { cv?: CvItem }) {
  if (!cv) {
    return (
      <Surface shadow className="border-[#cfcfc8] bg-[#f7f7f4]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Current source
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#171717]">
              Add your first CV
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
              Upload a PDF, DOC, or DOCX file to give Nyx a source for CV
              analysis, role matching, and cover letters.
            </p>
          </div>
          <a
            href="#add-new-cv"
            className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926]"
          >
            Add new CV
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </Surface>
    );
  }

  const title = cv.title || cv.originalName;
  const isReady = Boolean(cv.extractedText?.trim());

  return (
    <Surface shadow className="border-[#d8d2c5]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center bg-[#171717] text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Current source
            </p>
          </div>
          <h2 className="mt-3 truncate text-xl font-semibold text-[#171717]">
            {title}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm text-[#5f5f58] sm:grid-cols-3">
            <div>
              <dt className="text-[0.65rem] font-bold uppercase text-[#8a8a82]">
                Uploaded
              </dt>
              <dd className="mt-1 text-[#343430]">{formatDateTime(cv.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] font-bold uppercase text-[#8a8a82]">
                Size
              </dt>
              <dd className="mt-1 text-[#343430]">{formatBytes(cv.sizeBytes)}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] font-bold uppercase text-[#8a8a82]">
                Extracted text
              </dt>
              <dd className="mt-1 text-[#343430]">
                {isReady ? "Ready" : "Pending / Not extracted"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            href={`/dashboard/cvs/${cv.id}`}
            className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#cfcfc8] bg-white px-3 text-xs font-semibold text-[#343430] transition hover:bg-[#f1f1ee]"
          >
            View detail
          </Link>
          <Link
            href="/dashboard/analyze"
            className="inline-flex min-h-9 items-center justify-center gap-2 bg-[#171717] px-3 text-xs font-semibold text-white transition hover:bg-[#2b2926]"
          >
            Analyze
          </Link>
          <Link
            href="/dashboard/match"
            className="inline-flex min-h-9 items-center justify-center gap-2 border border-[#cfcfc8] bg-white px-3 text-xs font-semibold text-[#343430] transition hover:bg-[#f1f1ee]"
          >
            Match role
          </Link>
        </div>
      </div>
    </Surface>
  );
}

function sortByLatest(cvs: CvItem[]) {
  return [...cvs].sort((first, second) => {
    return (
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
  });
}
