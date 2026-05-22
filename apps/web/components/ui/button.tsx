import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

const variantClassName = {
  primary:
    "bg-[#171717] text-white hover:bg-[#2b2926] disabled:bg-[#a1a19a]",
  secondary:
    "border border-[#cfcfc8] bg-white text-[#343430] hover:bg-[#f1f1ee] disabled:text-[#6f6f68]",
  ghost: "text-[#5f5f58] hover:text-[#171717] disabled:text-[#a1a19a]",
};

const sizeClassName = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed ${variantClassName[variant]} ${sizeClassName[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
