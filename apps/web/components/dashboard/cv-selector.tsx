"use client";

import { FileText } from "lucide-react";

import type { CvItem } from "@/lib/api";

import { EmptyState } from "./result-ui";

export function CvSelector({
  cvs,
  selectedCvId,
  onChange,
}: {
  cvs: CvItem[];
  selectedCvId: string;
  onChange: (cvId: string) => void;
}) {
  if (cvs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Upload a CV first"
        description="Upload a CV before using this workflow. Nyx needs source text before it can analyze, match, rewrite, or prepare interview practice."
      />
    );
  }

  return (
    <div>
      <label
        htmlFor="cvId"
        className="block text-[0.7rem] font-bold uppercase text-[#6f6f68]"
      >
        CV
      </label>
      <div className="relative mt-2">
        <FileText
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f6f68]"
          aria-hidden="true"
        />
        <select
          id="cvId"
          name="cvId"
          value={selectedCvId}
          onChange={(event) => {
            onChange(event.currentTarget.value);
          }}
          className="block h-11 w-full appearance-none border border-[#e5e5df] bg-[#f7f7f4] px-10 pr-8 text-sm font-medium text-[#171717] outline-none transition hover:border-[#cfcfc8] focus:border-[#171717]"
        >
          {cvs.map((cv) => (
            <option key={cv.id} value={cv.id}>
              {cv.title || cv.originalName}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6f6f68]">
          ▾
        </span>
      </div>
    </div>
  );
}
