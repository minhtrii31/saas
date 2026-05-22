import type { ReactNode } from "react";

export function MetricTile({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 bg-[#ffffff] p-4 ${className}`}>
      <p className="text-[0.65rem] font-bold uppercase text-[#6f6f68]">
        {label}
      </p>
      <p className="mt-2 truncate text-base font-semibold text-[#171717]">
        {value}
      </p>
    </div>
  );
}

export function MetricGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-px overflow-hidden border border-[#e5e5df] bg-[#e5e5df] ${className}`}
    >
      {children}
    </div>
  );
}
