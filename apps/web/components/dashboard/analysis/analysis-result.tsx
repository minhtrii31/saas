"use client";

import { AlertTriangle, CheckCircle2, Gauge, Lightbulb, Sparkles } from "lucide-react";

import type { CvAnalysisResult } from "@/lib/api";

import { ResultSection, ScoreCard } from "../result-ui";

export function AnalysisResult({
  result,
  cvTitle,
}: {
  result: CvAnalysisResult;
  cvTitle: string;
}) {
  return (
    <section
      aria-label={`Analysis result for ${cvTitle}`}
      className="border border-[#d8d8d1] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <ScoreCard
          icon={Gauge}
          label="Audit score"
          value={result.score}
          detailLabel="Score"
          description={`Quality signal for ${cvTitle}. Higher scores indicate clearer positioning, stronger evidence, and fewer recruiter friction points.`}
        />
        <div className="min-w-0">
          <div className="border-b border-[#e5e5df] pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                AI report
              </p>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-[#171717]">
              Analysis report
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
              A structured read of what is working, what weakens the CV, and
              what to improve first.
            </p>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <ResultSection
              title="Strengths"
              items={result.strengths}
              icon={CheckCircle2}
              tone="strong"
            />
            <ResultSection
              title="Weaknesses"
              items={result.weaknesses}
              icon={AlertTriangle}
            />
            <ResultSection
              title="Suggestions"
              items={result.suggestions}
              icon={Lightbulb}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
