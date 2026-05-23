"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

type DropdownMenuItem = {
  label: string;
  href?: string;
  icon?: ReactNode;
  onSelect?: () => void;
  variant?: "default" | "danger";
};

type DropdownMenuProps = {
  label: string;
  trigger: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  header?: ReactNode;
};

export function DropdownMenu({
  label,
  trigger,
  items,
  align = "end",
  header,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleItemClick(
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    item: DropdownMenuItem,
  ) {
    if (item.onSelect) {
      event.preventDefault();
      item.onSelect();
    }

    setIsOpen(false);
  }

  const panelPosition = align === "end" ? "right-0" : "left-0";

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 border border-transparent bg-transparent px-0 text-[#171717] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#cfcfc8]"
      >
        {trigger}
        <ChevronDown
          className="h-3.5 w-3.5 text-[#6f6f68]"
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={label}
          className={`absolute ${panelPosition} top-full z-50 mt-2.5 w-[min(18rem,calc(100vw-2rem))] border border-[#d9d9d2] bg-white p-2 text-left shadow-xl shadow-zinc-950/10`}
        >
          {header ? (
            <div className="mb-2 border-b border-[#e5e5df] p-3">{header}</div>
          ) : (
            <div className="px-2 pb-1 pt-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#9a9288]">
              Account
            </div>
          )}
          {items.map((item) => {
            const itemClassName = `flex min-h-10 w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] font-medium transition hover:bg-[#f1f1ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#cfcfc8] ${
              item.variant === "danger"
                ? "mt-1 border-t border-[#e5e5df] pt-3 text-[#171717]"
                : "text-[#343430]"
            }`;
            const content = (
              <>
                <span className="flex min-w-0 items-center gap-2.5">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {item.href ? (
                  <span className="text-[#a1a19a]" aria-hidden="true">
                    /
                  </span>
                ) : null}
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  onClick={(event) => handleItemClick(event, item)}
                  className={itemClassName}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={(event) => handleItemClick(event, item)}
                className={itemClassName}
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
