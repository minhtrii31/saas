"use client";

import { Gauge, GitCompare } from "lucide-react";

import type { JdMatchResult } from "@/lib/api";

import { ReportPanel } from "../report-panel";

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
      className="border border-[#e5e5df] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02] md:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Match score
            </p>
          </div>
          <p className="mt-5 font-serif text-6xl font-medium leading-none text-[#171717]">
            {result.matchingScore}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#171717]">
            Matching score: {result.matchingScore}
          </p>
          <p className="mt-3 break-words text-sm leading-6 text-[#5f5f58]">
            Suitability signal for {cvTitle}.
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#171717]">
              Match report
            </h2>
          </div>
          <div className="mt-2 grid gap-4 xl:grid-cols-3">
            <ReportPanel title="Matched skills" items={result.matchedSkills} />
            <ReportPanel title="Missing skills" items={result.missingSkills} />
            <ReportPanel title="Suggestions" items={result.suggestions} />
          </div>
        </div>
      </div>
    </section>
  );
}
