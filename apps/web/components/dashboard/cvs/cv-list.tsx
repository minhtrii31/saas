"use client";

import Link from "next/link";

import type { CvItem } from "@/lib/api";

import { formatBytes, formatDateTime } from "../format";

export function CvList({ cvs }: { cvs: CvItem[] }) {
  if (cvs.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
        No CVs yet. Upload your first CV to start your library.
      </div>
    );
  }

  return (
    <ul className="mt-6 divide-y divide-zinc-200">
      {cvs.map((cv) => {
        const title = cv.title || cv.originalName;

        return (
          <li key={cv.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold text-zinc-950">{title}</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {cv.originalName}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Uploaded {formatDateTime(cv.createdAt)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-zinc-500">
                  {formatBytes(cv.sizeBytes)}
                </p>
                <Link
                  href={`/dashboard/cvs/${cv.id}`}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                >
                  View detail
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
