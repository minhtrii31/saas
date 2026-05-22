import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function FieldLabel({
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-[0.7rem] font-bold uppercase text-[#6f6f68] ${className}`}
      {...props}
    />
  );
}

export function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`mt-2 block h-11 w-full border border-[#e5e5df] bg-[#f7f7f4] px-3 text-sm text-[#171717] outline-none transition placeholder:text-[#9a9288] hover:border-[#cfcfc8] focus:border-[#171717] focus:bg-white ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`mt-2 block w-full border border-[#e5e5df] bg-[#f7f7f4] px-3 py-3 text-sm leading-6 text-[#171717] outline-none transition placeholder:text-[#9a9288] hover:border-[#cfcfc8] focus:border-[#171717] focus:bg-white ${className}`}
      {...props}
    />
  );
}

export function SelectInput({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`mt-2 block h-11 w-full border border-[#e5e5df] bg-[#f7f7f4] px-3 text-sm font-medium text-[#171717] outline-none transition hover:border-[#cfcfc8] focus:border-[#171717] focus:bg-white ${className}`}
      {...props}
    />
  );
}
