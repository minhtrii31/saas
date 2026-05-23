"use client";

import {
  ArrowRight,
  BadgeCheck,
  Lightbulb,
  Loader2,
  RefreshCw,
  ScanText,
  WandSparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  ResumeRewriteResult,
  RewriteRefinementInstruction,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

const goalLabels = {
  "stronger-impact": "Stronger impact",
  "ats-optimization": "ATS optimization",
  concise: "Concise",
  "quantified-achievements": "Quantified achievements",
  "leadership-tone": "Leadership tone",
};

const refinementActions: Array<{
  instruction: RewriteRefinementInstruction;
  label: string;
}> = [
  { instruction: "stronger", label: "Stronger" },
  { instruction: "shorter", label: "Shorter" },
  { instruction: "more-technical", label: "More technical" },
  { instruction: "more-leadership", label: "Leadership tone" },
  { instruction: "more-ats-friendly", label: "ATS-friendly" },
  { instruction: "more-results-focused", label: "Results-focused" },
];

export function RewriteResult({
  result,
  cvTitle,
  refinementState,
  onRefine,
}: {
  result: ResumeRewriteResult;
  cvTitle: string;
  refinementState?: Record<
    number,
    { type: "loading" } | { type: "error"; message: string } | undefined
  >;
  onRefine?: (
    suggestionIndex: number,
    instruction: RewriteRefinementInstruction,
  ) => void;
}) {
  return (
    <section
      aria-label={`Resume improvement result for ${cvTitle}`}
      className="border border-[#d8d8d1] bg-white p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-[#e5e5df] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Resume improvement
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#171717]">
            Stronger bullets for {cvTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
            Review the weak wording, compare the stronger version, then refine
            the suggestion until it fits the role and your experience.
          </p>
        </div>
        <p className="inline-flex w-fit border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-xs font-semibold text-[#343430]">
          {goalLabels[result.goal]}
        </p>
      </div>

      {result.suggestions.length > 0 ? (
        <div className="mt-5 space-y-5">
          {result.suggestions.map((suggestion, index) => (
            <article
              key={`${suggestion.original}-${index}`}
              className="overflow-hidden border border-[#d8d8d1] bg-[#fafaf8]"
            >
              <div className="flex flex-col gap-3 border-b border-[#e5e5df] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-[#171717] font-mono text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#171717]">
                      Bullet improvement
                    </p>
                    <p className="text-xs leading-5 text-[#6f6f68]">
                      Diagnose the weak signal, then upgrade the evidence.
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-2 py-1 text-xs font-semibold text-[#343430]">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Recruiter clarity
                </span>
              </div>

              <div className="grid gap-px bg-[#e5e5df] lg:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)]">
                <RewriteText
                  label="Original wording"
                  text={suggestion.original}
                  icon={ScanText}
                />
                <div className="hidden items-center justify-center bg-[#f7f7f4] text-[#a1a19a] lg:flex">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </div>
                <RewriteText
                  label={
                    refinementState?.[index]?.type === "loading"
                      ? "Refining"
                      : "Stronger rewrite"
                  }
                  text={suggestion.improved}
                  strong
                  loading={refinementState?.[index]?.type === "loading"}
                  icon={WandSparkles}
                />
              </div>

              <div className="p-4">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,0.7fr)] xl:items-start">
                  <div className="border border-[#e5e5df] bg-white p-3">
                    <div className="flex items-start gap-2 text-sm leading-6 text-[#343430]">
                      <Lightbulb
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#6f6f68]"
                        aria-hidden="true"
                      />
                      <p className="min-w-0 [overflow-wrap:anywhere]">
                        <span className="font-semibold text-[#171717]">
                          Why this improves recruiter clarity:{" "}
                        </span>
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#6f6f68]">
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Refine further
                    </div>
                    <div
                      className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:grid xl:grid-cols-2"
                      aria-label={`Refine suggestion ${index + 1}`}
                    >
                      {refinementActions.map((action) => {
                        const isLoading =
                          refinementState?.[index]?.type === "loading";

                        return (
                          <Button
                            key={action.instruction}
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => onRefine?.(index, action.instruction)}
                            className="w-full"
                          >
                            {isLoading ? (
                              <Loader2
                                className="h-3.5 w-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <WandSparkles
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                            )}
                            {action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {refinementState?.[index]?.type === "error" ? (
                  <p
                    role="alert"
                    className="mt-3 border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24]"
                  >
                    {refinementState[index]?.message}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-4 text-sm leading-6 text-[#5f5f58]">
          Nyx did not find resume bullets to improve in this pass. Try a
          different resume or improvement goal if the experience still feels
          unclear.
        </p>
      )}
    </section>
  );
}

function RewriteText({
  label,
  text,
  icon: Icon,
  strong = false,
  loading = false,
}: {
  label: string;
  text: string;
  icon: LucideIcon;
  strong?: boolean;
  loading?: boolean;
}) {
  return (
    <div className={`min-w-0 p-4 ${strong ? "bg-white" : "bg-[#f7f7f4]"}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#6f6f68]" aria-hidden="true" />
        <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </h3>
      </div>
      <p
        className={`mt-3 min-h-28 border p-3 text-sm leading-6 [overflow-wrap:anywhere] ${
          strong
            ? "border-[#d8d8d1] bg-[#fafaf8] font-medium text-[#171717]"
            : "border-[#e5e5df] bg-white text-[#5f5f58]"
        }`}
      >
        {loading ? (
          <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#6f6f68]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Updating this suggestion
          </span>
        ) : null}
        {text}
      </p>
    </div>
  );
}
