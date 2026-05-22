import type { ReactNode } from "react";

type StatusMessageProps = {
  children: ReactNode;
  className?: string;
  role?: "status" | "alert";
  tone?: "default" | "error" | "success" | "empty";
};

const toneClassName = {
  default: "border-[#e5e5df] bg-[#ffffff] text-[#5f5f58]",
  error: "border-[#e7d8cf] bg-[#fff7f2] text-[#8a3f24]",
  success: "border-[#cfcfc8] bg-[#f1f1ee] text-[#343430]",
  empty:
    "border-dashed border-[#cfcfc8] bg-[#f7f7f4] text-[#5f5f58]",
};

export function StatusMessage({
  children,
  className = "",
  role = "status",
  tone = "default",
}: StatusMessageProps) {
  return (
    <p
      role={role}
      className={`border px-3 py-2 text-sm leading-6 ${toneClassName[tone]} ${className}`}
    >
      {children}
    </p>
  );
}
