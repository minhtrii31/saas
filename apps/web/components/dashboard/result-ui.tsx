import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ScoreCardProps = {
  label: string;
  value: number;
  detailLabel: string;
  description: string;
  icon: LucideIcon;
};

export function ScoreCard({
  label,
  value,
  detailLabel,
  description,
  icon: Icon,
}: ScoreCardProps) {
  const score = Math.max(0, Math.min(100, value));
  const dialStyle = {
    "--score": `${score * 3.6}deg`,
  } as CSSProperties;

  return (
    <aside className="min-w-0 border border-[#d8d8d1] bg-[#f8f8f5] p-5 shadow-sm shadow-zinc-950/[0.03]">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#5f5f58]" aria-hidden="true" />
        <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
          {label}
        </p>
      </div>
      <div className="mt-6 grid place-items-center">
        <div
          className="grid h-36 w-36 place-items-center border border-[#d8d8d1] bg-[conic-gradient(#171717_var(--score),#e7e7e0_0)] p-2"
          style={dialStyle}
          aria-hidden="true"
        >
          <div className="grid h-full w-full place-items-center bg-[#f8f8f5]">
            <div className="text-center">
              <p className="font-serif text-6xl font-medium leading-none text-[#171717]">
                {value}
              </p>
              <p className="mt-1 font-mono text-[10px] font-bold uppercase text-[#6f6f68]">
                out of 100
              </p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-[#171717]">
        {detailLabel}: {value}
      </p>
      <p className="mt-3 min-w-0 text-sm leading-6 text-[#5f5f58] [overflow-wrap:anywhere]">
        {description}
      </p>
    </aside>
  );
}

type ResultSectionProps = {
  title: string;
  items?: string[];
  icon?: LucideIcon;
  tone?: "default" | "strong";
  emptyText?: string;
};

export function ResultSection({
  title,
  items,
  icon: Icon,
  tone = "default",
  emptyText = "No items returned.",
}: ResultSectionProps) {
  const hasItems = Boolean(items?.length);

  return (
    <section
      className={`border p-4 ${
        tone === "strong"
          ? "border-[#d8d8d1] bg-[#ffffff]"
          : "border-[#e5e5df] bg-[#fafaf8]"
      }`}
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#343430]">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        ) : null}
        <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
          {title}
        </h3>
      </div>
      {hasItems ? (
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[#343430]">
          {items?.map((item, index) => (
            <li key={item} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
              <span className="font-mono text-xs font-semibold text-[#a1a19a]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[#6f6f68]">{emptyText}</p>
      )}
    </section>
  );
}

export function LoadingSkeleton({
  label,
  children,
  className = "",
}: {
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`border border-[#e5e5df] bg-white p-5 ${className}`}
    >
      <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <div className="mt-4 h-7 w-2/3 bg-[#f1f1ee]" />
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full bg-[#f1f1ee]" />
        <div className="h-3 w-5/6 bg-[#f1f1ee]" />
        <div className="h-3 w-3/5 bg-[#f1f1ee]" />
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#171717] [overflow-wrap:anywhere]">
            {title}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-[#5f5f58]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
