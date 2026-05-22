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
    <div className="mt-3">
      <h3 className="text-sm font-medium text-zinc-800">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
