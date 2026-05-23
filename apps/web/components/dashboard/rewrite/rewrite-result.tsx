"use client";

import { ArrowRight, Lightbulb, Loader2, PenLine, WandSparkles } from "lucide-react";

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
              <RewriteText
                label={
                  refinementState?.[index]?.type === "loading"
                    ? "Refining"
                    : "Improved"
                }
                text={suggestion.improved}
                strong
                loading={refinementState?.[index]?.type === "loading"}
              />
              <div className="border-t border-[#e5e5df] pt-3 lg:col-span-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-2 text-sm leading-6 text-[#343430]">
                    <Lightbulb
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#6f6f68]"
                      aria-hidden="true"
                    />
                    <p className="min-w-0 [overflow-wrap:anywhere]">
                      <span className="font-semibold text-[#171717]">
                        Reason:{" "}
                      </span>
                      {suggestion.reason}
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-2"
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
  loading = false,
}: {
  label: string;
  text: string;
  strong?: boolean;
  loading?: boolean;
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
