"use client";

import { MessageSquareText, Sparkles } from "lucide-react";

import type { InterviewPrepResult, StarGuidance } from "@/lib/api";

import { AnalysisList } from "../analysis/analysis-list";

export function InterviewPrepResultPanel({
  result,
  cvTitle,
}: {
  result: InterviewPrepResult;
  cvTitle: string;
}) {
  return (
    <section
      aria-label={`Interview prep result for ${cvTitle}`}
      className="border border-[#d8d8d1] bg-[#ffffff] shadow-sm shadow-zinc-950/[0.03]"
    >
      <div className="border-b border-[#e5e5df] bg-[#f7f7f4] px-5 py-4">
        <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
          Interview prep
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#171717]">
              Practice set for {cvTitle}
            </h2>
            <p className="mt-1 text-sm capitalize text-[#5f5f58]">
              {result.focus} focus
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 border border-[#d8d8d1] bg-white px-3 py-2 text-sm font-semibold text-[#343430]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {result.questions.length} questions
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-4">
          {result.questions.map((item, index) => (
            <article
              key={`${item.question}-${index}`}
              className="border border-[#e5e5df] bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#d8d8d1] bg-[#f1f1ee] text-sm font-semibold text-[#343430]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-6 text-[#171717] [overflow-wrap:anywhere]">
                    {item.question}
                  </h3>
                  <QuestionBlock
                    label="Why it matters"
                    text={item.whyItMatters}
                  />
                  <QuestionBlock
                    label="Answer direction"
                    text={item.suggestedAnswerDirection}
                  />
                  {item.starGuidance ? (
                    <StarGuidanceGrid guidance={item.starGuidance} />
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="border border-[#e5e5df] bg-[#fafaf8] p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-[#343430]" />
            <h3 className="text-sm font-semibold text-[#171717]">
              Practice focus
            </h3>
          </div>
          <AnalysisList
            title="Weak points"
            items={result.weakPointFocusAreas}
          />
        </aside>
      </div>
    </section>
  );
}

function QuestionBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mt-3 border-l border-[#d8d8d1] pl-3">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#343430] [overflow-wrap:anywhere]">
        {text}
      </p>
    </div>
  );
}

function StarGuidanceGrid({ guidance }: { guidance: StarGuidance }) {
  const items = [
    { label: "Situation", value: guidance.situation },
    { label: "Task", value: guidance.task },
    { label: "Action", value: guidance.action },
    { label: "Result", value: guidance.result },
  ];

  return (
    <div className="mt-4 border border-[#e5e5df] bg-[#f7f7f4] p-3">
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        STAR structure
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="border border-[#e5e5df] bg-white p-3">
            <p className="text-xs font-semibold text-[#171717]">
              {item.label}
            </p>
            <p className="mt-1 text-sm leading-5 text-[#5f5f58] [overflow-wrap:anywhere]">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
