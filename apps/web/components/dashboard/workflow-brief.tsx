import type { LucideIcon } from "lucide-react";

type WorkflowBriefProps = {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  listTitle?: string;
  items?: string[];
};

export function WorkflowBrief({
  eyebrow,
  icon: Icon,
  title,
  description,
  listTitle,
  items = [],
}: WorkflowBriefProps) {
  return (
    <aside className="border border-[#e5e5df] bg-[#f7f7f4] p-5">
      <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        {eyebrow}
      </p>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#171717]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-[#171717]">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
            {description}
          </p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="mt-5 border-t border-[#e5e5df] pt-4">
          {listTitle ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
              {listTitle}
            </p>
          ) : null}
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5f5f58]">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
