import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68] ${className}`}
    >
      {children}
    </p>
  );
}

export function EditorialTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-serif text-[clamp(3rem,9vw,4.5rem)] font-normal leading-[0.95] tracking-[-0.045em] text-[#171717] ${className}`}
    >
      {children}
    </h2>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-[#171717] ${className}`}>
      {children}
    </h3>
  );
}

export function SectionDescription({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm leading-6 text-[#5f5f58] ${className}`}>
      {children}
    </p>
  );
}
