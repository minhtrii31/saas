"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FilePenLine,
  FileText,
  GitCompare,
  LockKeyhole,
  Mail,
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
import type { CvItem } from "@/lib/api";

type CvDetailState =
  | { type: "loading" }
  | { type: "ready"; cv: CvItem }
  | { type: "error"; message: string };

export function CvDetailClient({ cvId }: { cvId: string }) {
  return (
    <ProtectedPage
      title="CV detail"
      description="Review the source document Nyx uses for CV workflows."
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
  const hasExtractedText = extractedCharacters > 0;

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/cvs"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f5f58] transition hover:text-[#171717]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to CV Library
      </Link>

      <section className="border border-[#e5e5df] bg-[#ffffff]">
        <div className="grid gap-px bg-[#e5e5df] lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0 bg-white p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-[#e5e5df] bg-[#f7f7f4] text-[#5f5f58]">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                  Source document
                </p>
                <h2 className="mt-2 max-w-5xl text-2xl font-semibold leading-tight text-[#171717] [overflow-wrap:anywhere] sm:text-[1.8rem] font-serif">
                  {title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f5f58]">
                  Uploaded {formatDateTime(cv.createdAt)} - {cv.mimeType}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-[#fbfbf8] p-4 sm:p-5">
            <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
              Current state
            </p>
            <p className="mt-2 text-sm font-semibold text-[#171717]">
              {hasExtractedText ? "Ready to use" : "Needs text extraction"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#5f5f58]">
              {hasExtractedText
                ? `${extractedCharacters} characters available`
                : "AI workflows are locked until text is available."}
            </p>
          </div>
        </div>
      </section>

      <section className="border border-[#e5e5df] bg-[#ffffff] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Readiness
            </p>
            <h3 className="mt-1 text-base font-semibold text-[#171717]">
              Use this CV when the three checks are clear.
            </h3>
          </div>
          <p className="text-xs font-semibold text-[#5f5f58]">
            {hasExtractedText
              ? `${extractedCharacters} characters`
              : "No extracted text"}
          </p>
        </div>

        <div className="mt-4 grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] md:grid-cols-3">
          <ReadinessStep
            label="File stored"
            value={cv.storageKey ? "Ready" : "Missing"}
            ready={Boolean(cv.storageKey)}
          />
          <ReadinessStep
            label="Text extraction"
            value={hasExtractedText ? "Available" : "Missing"}
            ready={hasExtractedText}
          />
          <ReadinessStep
            label="AI workflows"
            value={hasExtractedText ? "Available" : "Locked"}
            ready={hasExtractedText}
          />
        </div>
      </section>

      <section className="border border-[#e5e5df] bg-[#ffffff] p-4">
        <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
          Primary actions
        </p>
        <div className="mt-3 grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] sm:grid-cols-2 xl:grid-cols-5">
          <ActionLink
            href="/dashboard/analyze"
            icon={Sparkles}
            title="Analyze this CV"
            description="Find strengths and weak spots."
          />
          <ActionLink
            href="/dashboard/match"
            icon={GitCompare}
            title="Match target role"
            description="Compare fit against a role."
          />
          <ActionLink
            href="/dashboard/cover-letter"
            icon={Mail}
            title="Generate cover letter"
            description="Draft a tailored note."
          />
          <ActionLink
            href="/dashboard/interview-prep"
            icon={ClipboardList}
            title="Prepare interview"
            description="Practice from CV evidence."
          />
          <ActionLink
            href="/dashboard/rewrite"
            icon={FilePenLine}
            title="Rewrite resume"
            description="Improve bullets and signal."
          />
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section
          aria-label="Extracted text preview"
          className="min-w-0 border border-[#e5e5df] bg-[#ffffff] p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                Extracted text preview
              </p>
              <h3 className="mt-1 text-base font-semibold text-[#171717]">
                What Nyx will read
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
                Nyx uses this text for AI workflows.
              </p>
            </div>
            <p className="font-mono text-xs text-[#6f6f68]">
              {hasExtractedText ? `${extractedCharacters} chars` : "No text"}
            </p>
          </div>

          {cv.extractedText ? (
            <div className="mt-4 grid max-h-[26rem] overflow-auto border border-[#e5e5df] bg-[#fbfbf8] sm:max-h-[34rem] sm:grid-cols-[3rem_minmax(0,1fr)]">
              <div className="hidden border-r border-[#e5e5df] bg-[#f1f1ee] px-3 py-4 text-right font-mono text-xs leading-7 text-[#8a8a82] sm:block">
                {cv.extractedText.split("\n").map((line, index) => (
                  <div key={`${index}-${line.slice(0, 8)}`}>{index + 1}</div>
                ))}
              </div>
              <p className="whitespace-pre-wrap p-4 text-sm leading-7 text-[#343430]">
                {cv.extractedText}
              </p>
            </div>
          ) : (
            <p className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-5 text-sm leading-6 text-[#5f5f58]">
              Extracted text is not available for this CV. Upload or extraction
              may not have completed, so AI workflows that depend on CV text are
              locked.
            </p>
          )}
        </section>

        <aside className="space-y-4">
          <section className="min-w-0 border border-[#e5e5df] bg-[#ffffff] p-4">
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Document metadata
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <MetadataItem
                label="Uploaded"
                value={formatDateTime(cv.createdAt)}
              />
              <MetadataItem label="File type" value={cv.mimeType} />
              <MetadataItem
                label="File size"
                value={formatBytes(cv.sizeBytes)}
              />
              <MetadataItem label="Source title" value={title} />
              <MetadataItem label="Original name" value={cv.originalName} />
            </dl>
          </section>

          <details className="group min-w-0 border border-[#e5e5df] bg-[#fbfbf8] p-4 text-sm">
            <summary className="cursor-pointer text-[0.7rem] font-bold uppercase text-[#6f6f68] transition hover:text-[#171717]">
              Technical details
            </summary>
            <dl className="mt-5 space-y-4">
              <MetadataItem label="Storage key" value={cv.storageKey} />
              <MetadataItem
                label="Storage URL"
                value={cv.storageUrl || "Not available"}
              />
              <MetadataItem label="Provider" value={cv.storageProvider} />
            </dl>
          </details>
        </aside>
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

function ReadinessStep({
  label,
  value,
  ready,
}: {
  label: string;
  value: string;
  ready: boolean;
}) {
  const Icon = ready ? CheckCircle2 : LockKeyhole;

  return (
    <div className="bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center border ${
            ready
              ? "border-[#cfd8c8] bg-[#f5f8f3] text-[#3f6f35]"
              : "border-[#e7d8cf] bg-[#fff7f2] text-[#8a3f24]"
          }`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#171717]">{value}</p>
        </div>
      </div>
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
      className="group block min-w-0 bg-white p-3 transition hover:bg-[#fbfbf8] sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#e5e5df] bg-[#f7f7f4] text-[#5f5f58] transition group-hover:border-[#cfcfc8] group-hover:text-[#171717]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="min-w-0 text-sm font-semibold text-[#171717]">
              {title}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#5f5f58]">
              {description}
            </p>
          </div>
        </div>
        <ArrowUpRight
          className="mt-1 h-3.5 w-3.5 shrink-0 text-[#8a8a82] transition group-hover:text-[#171717]"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
