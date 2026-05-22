import type { LucideIcon } from "lucide-react";

type ControlCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: string;
  dashed?: boolean;
};

export function ControlCard({
  icon: Icon,
  title,
  description,
  status,
  dashed = false,
}: ControlCardProps) {
  return (
    <article
      className={`border ${
        dashed ? "border-dashed border-[#cfcfc8]" : "border-[#e5e5df]"
      } bg-[#f7f7f4] p-4`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#171717]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[#171717]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            {description}
          </p>
          {status ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
              {status}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
