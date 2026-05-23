"use client";

import { Gauge, GitCompare, Lightbulb, MinusCircle, PlusCircle } from "lucide-react";

import type { JdMatchResult } from "@/lib/api";

import { ResultSection, ScoreCard } from "../result-ui";

export function MatchResult({
  result,
  cvTitle,
}: {
  result: JdMatchResult;
  cvTitle: string;
}) {
  return (
    <section
      aria-label={`JD match result for ${cvTitle}`}
      className="border border-[#d8d8d1] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.03] md:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <ScoreCard
          icon={Gauge}
          label="Match score"
          value={result.matchingScore}
          detailLabel="Matching score"
          description={`Suitability signal for ${cvTitle}. Use the gaps to decide whether to tailor evidence or skip the role.`}
        />
        <div className="min-w-0">
          <div className="border-b border-[#e5e5df] pb-4">
            <div className="flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                Role comparison
              </p>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-[#171717]">
              Match report
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5f58]">
              Skills are split into confirmed fit, missing evidence, and
              practical tailoring suggestions.
            </p>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <ResultSection
              title="Matched skills"
              items={result.matchedSkills}
              icon={PlusCircle}
              tone="strong"
            />
            <ResultSection
              title="Missing skills"
              items={result.missingSkills}
              icon={MinusCircle}
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
