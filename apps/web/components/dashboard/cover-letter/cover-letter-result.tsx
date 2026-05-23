"use client";

import { Clipboard, FilePenLine, Highlighter, Quote } from "lucide-react";

import type { CoverLetterResult } from "@/lib/api";

import { ResultSection } from "../result-ui";

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
      className="border border-[#d8d8d1] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FilePenLine className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Collaborative draft
            </p>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-[#171717]">
            Starting cover letter draft
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
            Nyx creates a strong starting draft you can personalize before
            sending.
          </p>
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
      <div className="mt-6 border border-[#e5e5df] bg-[#f3f3ef] p-3 md:p-5">
        <article className="mx-auto max-w-3xl border border-[#e5e5df] bg-[#ffffff] px-5 py-7 shadow-sm shadow-zinc-950/[0.03] md:px-8 md:py-9">
          <div className="mb-6 flex items-center justify-between border-b border-[#edede8] pb-4">
            <div className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                Editable draft
              </p>
            </div>
            <p className="text-sm font-semibold text-[#171717]">
              {result.tone}
            </p>
          </div>
          <p className="whitespace-pre-wrap text-[0.95rem] leading-8 text-[#2f2f2b]">
            {result.coverLetter}
          </p>
        </article>
      </div>
      <p className="mt-4 text-sm text-[#5f5f58]">
        Tone: <span className="font-semibold text-[#171717]">{result.tone}</span>
      </p>
      <div className="mt-5">
        <ResultSection
          title="Highlights"
          items={result.highlights}
          icon={Highlighter}
          tone="strong"
          emptyText="No highlights returned."
        />
      </div>
    </section>
  );
}
