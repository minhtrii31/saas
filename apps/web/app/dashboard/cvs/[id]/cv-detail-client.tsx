"use client";

import {
  ArrowLeft,
  FilePenLine,
  FileText,
  GitCompare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  fetchCv,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { formatBytes, formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { MetricGrid, MetricTile } from "@/components/ui/metric";
import type { CvItem } from "@/lib/api";

type CvDetailState =
  | { type: "loading" }
  | { type: "ready"; cv: CvItem }
  | { type: "error"; message: string };

export function CvDetailClient({ cvId }: { cvId: string }) {
  return (
    <ProtectedPage
      title="CV detail"
      description="Review file metadata and extracted text when it is available."
    >
      {({ token }) => <CvDetailContent token={token} cvId={cvId} />}
    </ProtectedPage>
  );
}

function CvDetailContent({ token, cvId }: { token: string; cvId: string }) {
  const router = useRouter();
  const [state, setState] = useState<CvDetailState>({ type: "loading" });

  useEffect(() => {
    let isActive = true;

    async function loadCv() {
      try {
        const cv = await fetchCv(token, cvId);

        if (isActive) {
          setState({ type: "ready", cv });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }

        setState({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to load CV detail. Please try again.",
          ),
        });
      }
    }

    void loadCv();

    return () => {
      isActive = false;
    };
  }, [cvId, router, token]);

  if (state.type === "loading") {
    return (
      <section
        role="status"
        className="border border-[#e5e5df] bg-[#ffffff] p-6 text-sm text-[#5f5f58]"
      >
        Loading CV detail...
      </section>
    );
  }

  if (state.type === "error") {
    return (
      <p
        role="alert"
        className="border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
      >
        {state.message}
      </p>
    );
  }

  const cv = state.cv;
  const title = cv.title || cv.originalName;
  const extractedCharacters = cv.extractedText?.length || 0;

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/cvs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f5f58] transition hover:text-[#171717]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to repository
      </Link>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 border border-[#e5e5df] bg-[#ffffff] p-4 shadow-sm shadow-zinc-950/[0.02] sm:p-5 md:p-7">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#171717] text-white">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                CV dossier
              </p>
              <h2 className="mt-3 max-w-5xl font-serif text-[1.9rem] font-medium leading-[1.06] text-[#171717] [overflow-wrap:anywhere] sm:text-3xl lg:text-[2.65rem]">
                {title}
              </h2>
              <p className="mt-4 max-w-3xl break-all text-sm leading-6 text-[#5f5f58]">
                {cv.originalName}
              </p>
            </div>
          </div>

          <MetricGrid className="mt-5 sm:mt-7 sm:grid-cols-3">
            <MetricTile label="Size" value={formatBytes(cv.sizeBytes)} />
            <MetricTile
              label="Text"
              value={extractedCharacters > 0 ? `${extractedCharacters}` : "--"}
            />
            <MetricTile label="Provider" value={cv.storageProvider} />
          </MetricGrid>

          <div className="mt-5 border border-[#e5e5df] bg-[#f7f7f4] p-4">
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Source readiness
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <ReadinessItem
                label="File stored"
                value={cv.storageKey ? "Ready" : "Missing"}
              />
              <ReadinessItem
                label="Text extraction"
                value={extractedCharacters > 0 ? "Available" : "Pending"}
              />
              <ReadinessItem
                label="AI workflows"
                value={extractedCharacters > 0 ? "Unlocked" : "Limited"}
              />
            </div>
          </div>
        </div>

        <aside className="min-w-0 border border-[#e5e5df] bg-[#f7f7f4] p-4 sm:p-5">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Next actions
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:block xl:space-y-2">
            <ActionLink
              href="/dashboard/analyze"
              icon={Sparkles}
              title="Run CV audit"
              description="Find strengths, weaknesses, and suggestions."
            />
            <ActionLink
              href="/dashboard/match"
              icon={GitCompare}
              title="Match a job"
              description="Compare this CV against a job description."
            />
            <ActionLink
              href="/dashboard/cover-letter"
              icon={FilePenLine}
              title="Draft cover letter"
              description="Generate an application note from your CV."
            />
          </div>
        </aside>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,0.38fr)_minmax(0,1fr)]">
        <aside className="min-w-0 border border-[#e5e5df] bg-[#ffffff] p-4 sm:p-5">
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            File metadata
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <MetadataItem label="Uploaded" value={formatDateTime(cv.createdAt)} />
            <MetadataItem label="Type" value={cv.mimeType} />
            <MetadataItem label="Storage URL" value={cv.storageUrl || "Not available"} />
            <MetadataItem label="Storage key" value={cv.storageKey} />
          </dl>
        </aside>

        <section
          aria-label="Extracted text preview"
          className="min-w-0 border border-[#e5e5df] bg-[#ffffff] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                Extraction
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#171717]">
                Text preview
              </h3>
            </div>
            <p className="font-mono text-xs text-[#6f6f68]">
              {extractedCharacters > 0 ? `${extractedCharacters} chars` : "No text"}
            </p>
          </div>

          {cv.extractedText ? (
            <div className="mt-5 max-h-[26rem] overflow-auto border border-[#e5e5df] bg-[#f7f7f4] p-4 sm:max-h-[34rem] sm:p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-[#343430]">
                {cv.extractedText}
              </p>
            </div>
          ) : (
            <p className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-5 text-sm leading-6 text-[#5f5f58]">
              Extracted text is not available for this CV yet.
            </p>
          )}
        </section>
      </section>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-[#343430] [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

function ReadinessItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#e5e5df] bg-white p-3">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#171717]">{value}</p>
    </div>
  );
}

function ActionLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Sparkles;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group block min-w-0 border border-[#e5e5df] bg-[#ffffff] p-3 transition hover:border-[#cfcfc8] hover:bg-white sm:p-4"
    >
      <div className="flex items-center gap-3">
        <Icon
          className="h-4 w-4 text-[#6f6f68] transition group-hover:text-[#171717]"
          aria-hidden="true"
        />
        <p className="min-w-0 text-sm font-semibold text-[#171717]">{title}</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#5f5f58]">{description}</p>
    </Link>
  );
}
