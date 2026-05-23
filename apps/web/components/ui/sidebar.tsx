"use client";

import {
  ArrowUpRight,
  FilePenLine,
  FileText,
  GitCompare,
  History,
  LayoutDashboard,
  LogOut,
  Sliders,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type SidebarProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogout: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/cvs", label: "CV Repository", icon: FileText },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { href: "/dashboard/analyze", label: "AI Analysis", icon: Sparkles },
      { href: "/dashboard/match", label: "Job Match", icon: GitCompare },
      {
        href: "/dashboard/cover-letter",
        label: "Cover Letter",
        icon: FilePenLine,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/history", label: "History", icon: History },
      { href: "/dashboard/settings", label: "Settings", icon: Sliders },
    ],
  },
];

export function Sidebar({ isOpen, onOpenChange, onLogout }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  function isItemActive(href: string) {
    return href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeSidebar() {
    onOpenChange(false);
  }

  const nav = (
    <nav aria-label="Dashboard navigation" className="flex flex-col gap-5 px-3">
      {navSections.map((section) => {
        const sectionId = `${section.label.toLowerCase().replaceAll(" ", "-")}-nav`;

        return (
          <section key={section.label} aria-labelledby={sectionId}>
            <h2
              id={sectionId}
              className="px-3 pb-2 text-[0.65rem] font-bold uppercase leading-none tracking-[0.2em] text-[#6f6f68]"
            >
              {section.label}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={closeSidebar}
                    className={`group relative flex min-h-10 w-full items-center justify-between overflow-hidden rounded-md px-3 py-2 text-[13px] font-medium leading-5 outline-none transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2px focus-visible:outline-[#cfcfc8] ${
                      isActive
                        ? "bg-[#171717] text-white shadow-sm shadow-zinc-950/10"
                        : "text-[#6f6f68] hover:bg-white hover:text-[#171717]"
                    }`}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-white"
                      />
                    ) : null}
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon
                        className={`h-4 w-4 shrink-0 stroke-[2.1] transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-[#6f6f68] group-hover:text-[#343430]"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition ${
                        isActive
                          ? "bg-white"
                          : "bg-[#cfcfc8] opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </nav>
  );

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close dashboard menu"
          className="fixed inset-0 z-40 bg-zinc-950/25 backdrop-blur-[1px] lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        id="dashboard-mobile-sidebar"
        aria-label="Dashboard sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,100vw)] select-none flex-col justify-between border-r border-[#e5e5df] bg-[#f7f7f4] py-5 shadow-2xl shadow-zinc-950/10 transition-transform duration-200 lg:w-62 lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="min-h-0 overflow-y-auto">
          <div className="flex min-h-11 items-center justify-between gap-3 px-5 pb-6">
            <Link
              href="/dashboard"
              onClick={closeSidebar}
              className="flex min-w-0 items-center gap-2 text-[#171717] transition hover:text-[#343430] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cfcfc8]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#171717] font-serif text-lg leading-none text-white">
                N
              </span>
              <span className="min-w-0">
                <span className="block truncate font-serif text-[1.35rem]">
                  Nyx
                </span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f6f68]">
                  CV workspace
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close dashboard menu"
              onClick={closeSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717] shadow-sm transition hover:bg-[#f1f1ee] lg:hidden"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {nav}
        </div>

        <div className="px-4 pt-4">
          <Link
            href="/dashboard/analyze"
            onClick={closeSidebar}
            className="mb-4 flex min-h-10 items-center justify-between gap-3 bg-[#171717] px-3 text-xs font-bold text-white transition hover:bg-[#2b2926]"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              New analysis
            </span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-2 border-t border-[#e5e5df] px-2 pt-4 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative flex h-7 w-7 shrink-0 items-center justify-center bg-white font-mono text-[10px] font-extrabold text-[#171717]">
                <span className="absolute right-0 top-0 h-2 w-2 bg-[#171717]" />
                OS
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold leading-4 text-[#171717]">
                  Workspace ready
                </p>
                <p className="truncate text-[11px] leading-3 text-[#6f6f68]">
                  Personal dashboard
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Log out"
              onClick={() => {
                closeSidebar();
                onLogout();
              }}
              className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#6f6f68] transition hover:bg-[#f1f1ee] hover:text-[#171717]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
