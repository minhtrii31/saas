import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", leadingIcon, ...props }, ref) => {
    const inputClassName = `h-11 w-full border border-zinc-300 bg-white px-3 text-sm text-zinc-950 shadow-sm transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-zinc-950 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 ${
      leadingIcon ? "pl-10" : ""
    } ${className}`;

    if (!leadingIcon) {
      return <input ref={ref} className={inputClassName} {...props} />;
    }

    return (
      <span className="relative block w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-zinc-400">
          {leadingIcon}
        </span>
        <input ref={ref} className={inputClassName} {...props} />
      </span>
    );
  },
);

Input.displayName = "Input";
