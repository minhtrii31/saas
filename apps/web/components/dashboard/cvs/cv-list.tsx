"use client";

import { ArrowUpRight, FileText, Upload } from "lucide-react";
import Link from "next/link";

import type { CvItem } from "@/lib/api";

import { formatBytes, formatDateTime } from "../format";

export function CvList({ cvs }: { cvs: CvItem[] }) {
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
              No CVs yet. Upload your first CV to start your library. Once
              uploaded, it can power analysis, matching, and cover letters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-5 divide-y divide-[#e5e5df] border-y border-[#e5e5df]">
      {cvs.map((cv, index) => {
        const title = cv.title || cv.originalName;

        return (
          <li key={cv.id}>
            <Link
              href={`/dashboard/cvs/${cv.id}`}
              className="group grid gap-4 py-4 transition hover:bg-[#f7f7f4] sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="flex min-w-0 gap-3 px-2">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-[#f1f1ee] text-[#343430]">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#a1a19a]">
                    CV {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="truncate text-sm font-semibold text-[#171717]">
                    {title}
                  </h3>
                  <p className="mt-1 truncate text-xs text-[#6f6f68]">
                    {cv.originalName}
                  </p>
                  <p className="mt-1 text-xs text-[#6f6f68]">
                    Uploaded {formatDateTime(cv.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-2 sm:justify-end">
                <p className="font-mono text-xs text-[#6f6f68]">
                  {formatBytes(cv.sizeBytes)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5f5f58] transition group-hover:text-[#171717]">
                  View detail
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
