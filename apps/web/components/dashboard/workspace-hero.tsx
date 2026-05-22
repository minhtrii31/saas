import type { ReactNode } from "react";

import { ArrowUpRight } from "lucide-react";

import {
  EditorialTitle,
  Eyebrow,
  SectionDescription,
} from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";

export function WorkspaceHero({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const main = (
    <Surface
      padding="lg"
      shadow
      className="relative overflow-hidden"
    >
      <div className="absolute right-0 top-0 hidden h-full w-24 border-l border-[#e5e5df] bg-[#f7f7f4] md:block">
        <div className="flex h-full flex-col items-center justify-between py-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#171717]" />
          <span className="rotate-90 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#6f6f68]">
            Ready
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#6f6f68]" aria-hidden="true" />
        </div>
      </div>
      <div className="relative md:pr-24">
        <Eyebrow>{eyebrow}</Eyebrow>
        <EditorialTitle className="mt-3 max-w-4xl">{title}</EditorialTitle>
        <SectionDescription className="mt-4 max-w-2xl">
          {description}
        </SectionDescription>
        {children}
      </div>
    </Surface>
  );

  if (!aside) {
    return main;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {main}
      {aside}
    </section>
  );
}
