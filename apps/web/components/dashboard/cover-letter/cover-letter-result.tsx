"use client";

import { Clipboard, FilePenLine } from "lucide-react";

import type { CoverLetterResult } from "@/lib/api";

import { AnalysisList } from "../analysis/analysis-list";

export function CoverLetterResultPanel({
  result,
  cvTitle,
  copied,
  onCopy,
}: {
  result: CoverLetterResult;
  cvTitle: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <section
      aria-label={`Cover letter result for ${cvTitle}`}
      className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FilePenLine className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Draft
            </p>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-[#171717]">
            Generated cover letter
          </h2>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex w-fit items-center gap-2 border border-[#cfcfc8] bg-white px-3 py-2 text-xs font-semibold text-[#343430] transition hover:bg-[#f1f1ee]"
        >
          <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-5 border border-[#e5e5df] bg-[#f7f7f4] p-5">
        <p className="whitespace-pre-wrap text-sm leading-7 text-[#343430]">
        {result.coverLetter}
        </p>
      </div>
      <p className="mt-4 text-sm text-[#5f5f58]">
        Tone: <span className="font-semibold text-[#171717]">{result.tone}</span>
      </p>
      <AnalysisList title="Highlights" items={result.highlights} />
    </section>
  );
}
