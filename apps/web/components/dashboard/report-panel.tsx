import { AnalysisList } from "./analysis/analysis-list";

export function ReportPanel({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <div className="border border-[#e5e5df] bg-[#f7f7f4] p-4">
      <AnalysisList title={title} items={items} />
      {!items || items.length === 0 ? (
        <p className="mt-2 text-sm leading-6 text-[#6f6f68]">
          No items returned.
        </p>
      ) : null}
    </div>
  );
}
