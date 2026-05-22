"use client";

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
      className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-lg font-semibold text-zinc-950">
          Generated cover letter
        </h2>
        <button
          type="button"
          onClick={onCopy}
          className="w-fit rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
        {result.coverLetter}
      </p>
      <p className="mt-3 text-sm text-zinc-700">
        Tone: <span className="font-semibold text-zinc-950">{result.tone}</span>
      </p>
      <AnalysisList title="Highlights" items={result.highlights} />
    </section>
  );
}
