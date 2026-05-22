"use client";

export function AnalysisList({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
        {title}
      </h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-[#343430]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a1a19a]"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
