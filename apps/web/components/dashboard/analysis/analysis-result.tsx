"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Lightbulb,
  Sparkles,
} from "lucide-react";

import type { CvAnalysisResult } from "@/lib/api";

import { ResultSection, ScoreCard } from "../result-ui";

const scoringCategoryLabels: Array<{
  key: keyof NonNullable<CvAnalysisResult["scoringCategories"]>;
  label: string;
}> = [
  { key: "atsReadiness", label: "ATS readiness" },
  { key: "readability", label: "Readability" },
  { key: "impact", label: "Impact" },
  { key: "keywordOptimization", label: "Keyword optimization" },
  { key: "structure", label: "Structure" },
  { key: "experienceQuality", label: "Experience quality" },
];

const actionableInsightLabels: Array<{
  key: keyof NonNullable<CvAnalysisResult["actionableInsights"]>;
  label: string;
}> = [
  { key: "missingQuantifiedAchievements", label: "Missing quantified achievements" },
  { key: "weakActionVerbs", label: "Weak action verbs" },
  { key: "missingSections", label: "Missing sections" },
  { key: "overlyGenericWording", label: "Overly generic wording" },
  { key: "formattingConcerns", label: "Formatting concerns" },
  { key: "keywordGaps", label: "Keyword gaps" },
];

export function AnalysisResult({
  result,
  cvTitle,
}: {
  result: CvAnalysisResult;
  cvTitle: string;
}) {
  const scoringCategories = scoringCategoryLabels.flatMap(({ key, label }) => {
    const value = result.scoringCategories?.[key];

    return typeof value === "number" ? [{ key, label, value }] : [];
  });
  const actionableInsights = actionableInsightLabels
    .map(({ key, label }) => ({
      key,
      label,
      items: result.actionableInsights?.[key],
    }))
    .filter(({ items }) => Boolean(items?.length));

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
          {scoringCategories.length > 0 ? (
            <section className="mt-5 border border-[#e5e5df] bg-[#fafaf8] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#343430]">
                  <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                  Recruiter and ATS scorecard
                </h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {scoringCategories.map((category) => (
                  <ScoreCategory
                    key={category.key}
                    label={category.label}
                    value={category.value}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {actionableInsights.length > 0 ? (
            <section className="mt-5 border border-[#e5e5df] bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#e5e5df] bg-[#f7f7f4] text-[#343430]">
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                  Actionable insight queue
                </h3>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {actionableInsights.map((group) => (
                  <ResultSection
                    key={group.key}
                    title={group.label}
                    items={group.items}
                    emptyText="No issues returned."
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ScoreCategory({ label, value }: { label: string; value: number }) {
  const score = Math.max(0, Math.min(100, value));

  return (
    <div className="border border-[#e5e5df] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
          {label}
        </p>
        <p className="font-mono text-sm font-bold text-[#171717]">{value}</p>
      </div>
      <div
        className="mt-3 h-2 border border-[#d8d8d1] bg-[#f1f1ee]"
        aria-hidden="true"
      >
        <div className="h-full bg-[#343430]" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
