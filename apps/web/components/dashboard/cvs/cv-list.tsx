"use client";

import { ArrowUpRight, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { CvItem } from "@/lib/api";

import { formatBytes, formatDateTime } from "../format";

const defaultVisibleCount = 5;

export function CvList({ cvs }: { cvs: CvItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const duplicateSummary = useMemo(() => getDuplicateSummary(cvs), [cvs]);
  const visibleCvs = showAll ? cvs : cvs.slice(0, defaultVisibleCount);
  const hiddenCount = Math.max(cvs.length - defaultVisibleCount, 0);

  if (cvs.length === 0) {
    return (
      <div className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-[#171717]">
            <Upload className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">
              Start your source library
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#5f5f58]">
              No CVs yet. Use the Add new CV form above to start your source
              library. Once uploaded, it can power analysis, matching, and cover
              letters.
            </p>
            <a
              href="#add-new-cv"
              className="mt-4 inline-flex min-h-9 items-center justify-center bg-[#171717] px-3 text-xs font-semibold text-white transition hover:bg-[#2b2926]"
            >
              Add new CV
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <ul className="divide-y divide-[#e5e5df] border-y border-[#e5e5df]">
      {visibleCvs.map((cv) => {
        const title = cv.title || cv.originalName;
        const isReady = Boolean(cv.extractedText?.trim());
        const duplicate = duplicateSummary.get(normalizeName(cv.originalName));
        const isLatestVersion = duplicate?.latestId === cv.id;

        return (
          <li key={cv.id}>
            <div className="grid gap-4 py-4 transition hover:bg-[#f7f7f4] sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 gap-3 px-2">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-[#f1f1ee] text-[#343430]">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {duplicate && duplicate.count > 1 ? (
                      <span className="bg-[#f1f1ee] px-2 py-1 text-[0.65rem] font-bold uppercase text-[#5f5f58]">
                        {duplicate.count} versions
                      </span>
                    ) : null}
                    {isLatestVersion && duplicate && duplicate.count > 1 ? (
                      <span className="bg-[#171717] px-2 py-1 text-[0.65rem] font-bold uppercase text-white">
                        Latest version
                      </span>
                    ) : null}
                    <span className="bg-white px-2 py-1 text-[0.65rem] font-bold uppercase text-[#5f5f58]">
                      {isReady ? "Ready" : "Pending / Not extracted"}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/cvs/${cv.id}`}
                    className="block truncate text-sm font-semibold text-[#171717] transition hover:text-[#5f5f58]"
                  >
                    {title}
                  </Link>
                  <p className="mt-1 text-xs text-[#6f6f68]">
                    Uploaded {formatDateTime(cv.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:justify-end">
                <p className="font-mono text-xs text-[#6f6f68]">
                  {formatBytes(cv.sizeBytes)}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/cvs/${cv.id}`}
                    className="inline-flex min-h-8 items-center justify-center gap-1 border border-[#cfcfc8] bg-white px-2.5 text-xs font-semibold text-[#343430] transition hover:bg-[#f1f1ee]"
                  >
                    View
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/dashboard/analyze"
                    className="inline-flex min-h-8 items-center justify-center bg-[#171717] px-2.5 text-xs font-semibold text-white transition hover:bg-[#2b2926]"
                  >
                    Analyze
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
      </ul>

      {hiddenCount > 0 ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex min-h-9 items-center justify-center border border-[#cfcfc8] bg-white px-3 text-xs font-semibold text-[#343430] transition hover:bg-[#f1f1ee]"
          >
            {showAll
              ? "Show latest 5"
              : `Show all documents (${cvs.length})`}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function getDuplicateSummary(cvs: CvItem[]) {
  const summary = new Map<string, { count: number; latestId: string }>();

  for (const cv of cvs) {
    const key = normalizeName(cv.originalName);
    const current = summary.get(key);

    if (!current) {
      summary.set(key, { count: 1, latestId: cv.id });
      continue;
    }

    const currentLatest = cvs.find((item) => item.id === current.latestId);
    const isNewer =
      !currentLatest ||
      new Date(cv.createdAt).getTime() > new Date(currentLatest.createdAt).getTime();

    summary.set(key, {
      count: current.count + 1,
      latestId: isNewer ? cv.id : current.latestId,
    });
  }

  return summary;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}
