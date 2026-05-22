import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type SurfaceProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  tone?: "default" | "subtle" | "white";
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

const toneClassName = {
  default: "border-[#e5e5df] bg-white",
  subtle: "border-[#e5e5df] bg-[#f7f7f4]",
  white: "border-[#e5e5df] bg-white",
};

const paddingClassName = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 md:p-7",
};

export function Surface<T extends ElementType = "section">({
  as,
  children,
  className = "",
  tone = "default",
  padding = "md",
  shadow = false,
  ...props
}: SurfaceProps<T>) {
  const Component = as || "section";

  return (
    <Component
      className={`border ${toneClassName[tone]} ${paddingClassName[padding]} ${
        shadow ? "shadow-sm shadow-zinc-950/[0.02]" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
