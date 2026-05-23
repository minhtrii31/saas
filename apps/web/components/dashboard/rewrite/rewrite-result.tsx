"use client";

import { ArrowRight, Lightbulb, PenLine } from "lucide-react";

import type { ResumeRewriteResult } from "@/lib/api";

const goalLabels = {
  "stronger-impact": "Stronger impact",
  "ats-optimization": "ATS optimization",
  concise: "Concise",
  "quantified-achievements": "Quantified achievements",
  "leadership-tone": "Leadership tone",
};

export function RewriteResult({
  result,
  cvTitle,
}: {
  result: ResumeRewriteResult;
  cvTitle: string;
}) {
  return (
    <section
      aria-label={`Resume rewrite result for ${cvTitle}`}
      className="border border-[#d8d8d1] bg-white p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#e5e5df] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Before / after workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#171717]">
            Rewrite suggestions for {cvTitle}
          </h2>
        </div>
        <p className="inline-flex w-fit border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-xs font-semibold text-[#343430]">
          {goalLabels[result.goal]}
        </p>
      </div>

      {result.suggestions.length > 0 ? (
        <div className="mt-5 space-y-4">
          {result.suggestions.map((suggestion, index) => (
            <article
              key={`${suggestion.original}-${index}`}
              className="grid gap-3 border border-[#e5e5df] bg-[#fafaf8] p-4 lg:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)]"
            >
              <RewriteText label="Original" text={suggestion.original} />
              <div className="hidden items-center justify-center text-[#a1a19a] lg:flex">
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </div>
              <RewriteText label="Improved" text={suggestion.improved} strong />
              <div className="border-t border-[#e5e5df] pt-3 lg:col-span-3">
                <div className="flex items-start gap-2 text-sm leading-6 text-[#343430]">
                  <Lightbulb
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#6f6f68]"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 [overflow-wrap:anywhere]">
                    <span className="font-semibold text-[#171717]">Reason: </span>
                    {suggestion.reason}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-4 text-sm leading-6 text-[#5f5f58]">
          No rewrite suggestions were returned.
        </p>
      )}
    </section>
  );
}

function RewriteText({
  label,
  text,
  strong = false,
}: {
  label: string;
  text: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <PenLine className="h-3.5 w-3.5 text-[#6f6f68]" aria-hidden="true" />
        <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </h3>
      </div>
      <p
        className={`mt-3 min-h-24 border p-3 text-sm leading-6 [overflow-wrap:anywhere] ${
          strong
            ? "border-[#d8d8d1] bg-white font-medium text-[#171717]"
            : "border-[#e5e5df] bg-[#f7f7f4] text-[#5f5f58]"
        }`}
      >
        {text}
      </p>
    </div>
  );
}
