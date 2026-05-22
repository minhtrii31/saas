"use client";

import {
  History,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { AuthUser } from "@/lib/api";

import { Avatar } from "./avatar";
import { DropdownMenu } from "./dropdown-menu";
import { Input } from "./input";

type TopHeaderProps = {
  title: string;
  description?: string;
  user?: AuthUser;
  onLogout: () => void;
  onOpenSidebar: () => void;
};

export function TopHeader({
  title,
  description,
  user,
  onLogout,
  onOpenSidebar,
}: TopHeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const headerMeta = getHeaderMeta(pathname);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <header className="sticky top-0 z-30 select-none border-b border-[#e5e5df] bg-[#ffffff]/92 backdrop-blur-xl">
      <div className="px-4 py-3 sm:px-6 md:px-7 lg:px-9">
        <div className="grid min-h-10 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:min-h-12 lg:grid-cols-[minmax(14rem,1fr)_minmax(20rem,31rem)_auto] lg:gap-6">
          <button
            type="button"
            aria-label="Open dashboard menu"
            onClick={onOpenSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e5e5df] bg-white text-[#171717] shadow-sm transition hover:bg-[#f1f1ee] lg:hidden"
          >
            <Menu className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-[1.05rem] font-semibold leading-5 text-[#171717]">
              {title}
            </h1>
            {user && !user.name ? (
              <h2 className="sr-only">{user.email}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 hidden truncate text-sm leading-5 text-[#5f5f58] md:block">
                {description}
              </p>
            ) : null}
          </div>

          <form
            role="search"
            aria-label="Dashboard search"
            onSubmit={handleSearchSubmit}
            className="hidden lg:block"
          >
            <div className="group relative flex items-center">
              <Input
                id="topbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search CVs, analyses, or commands..."
                aria-label="Search dashboard"
                leadingIcon={
                  <Search className="h-3.5 w-3.5 transition-colors group-hover:text-[#171717]" aria-hidden="true" />
                }
                className="h-10 rounded-none border-[#e5e5df] bg-[#f7f7f4] py-1.5 pl-10 pr-[6.5rem] text-[13px] text-[#171717] shadow-sm shadow-zinc-950/[0.02] placeholder:text-[#9a9288] hover:border-[#cfcfc8] hover:bg-white focus:border-[#171717] focus:bg-white"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 border border-[#e5e5df] bg-white px-2 py-1 font-mono text-[9px] font-bold leading-none text-[#6f6f68]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                CMD
              </span>
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2 text-xs text-[#5f5f58] xl:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[#171717]" aria-hidden="true" />
              <span className="font-semibold text-[#171717]">{headerMeta.mode}</span>
              <span className="text-[#a1a19a]">/</span>
              <span>{headerMeta.status}</span>
            </div>
            <DropdownMenu
              label="User menu"
              trigger={
                <div className="flex items-center gap-2 border border-[#e5e5df] bg-white p-1 pr-2 transition hover:bg-[#f7f7f4]">
                  <Avatar
                    name={user?.name}
                    email={user?.email}
                    className="h-8 w-8 border-[#171717] bg-[#171717] font-mono text-[11px] font-extrabold text-white shadow-none"
                  />
                  <span className="hidden max-w-40 min-w-0 text-left xl:block">
                    <span className="block truncate text-[11px] font-bold leading-tight text-[#171717]">
                      {(user?.name || user?.email || "Workspace").split("@")[0]}
                    </span>
                    <span className="block truncate font-mono text-[9px] leading-none text-[#6f6f68]">
                      {user?.email || "Signed in"}
                    </span>
                  </span>
                </div>
              }
              header={
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={user?.name}
                      email={user?.email}
                      className="h-10 w-10 border-[#171717] bg-[#171717] font-mono text-xs font-extrabold text-white"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#171717]">
                        {user?.name || "Signed in"}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-[#6f6f68]">
                        {user?.email || "Workspace user"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border border-[#e5e5df] bg-[#f7f7f4] px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2 text-xs text-[#5f5f58]">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#171717]" aria-hidden="true" />
                      <span className="truncate">Session ready</span>
                    </span>
                    <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#6f6f68]">
                      {headerMeta.section}
                    </span>
                  </div>
                </div>
              }
              items={[
                {
                  label: "History",
                  href: "/dashboard/history",
                  icon: <History className="h-4 w-4" aria-hidden="true" />,
                },
                {
                  label: "Settings",
                  href: "/dashboard/settings",
                  icon: <Settings className="h-4 w-4" aria-hidden="true" />,
                },
                {
                  label: "Log out",
                  onSelect: onLogout,
                  icon: <LogOut className="h-4 w-4" aria-hidden="true" />,
                  variant: "danger",
                },
              ]}
            />
          </div>
        </div>

        <form
          role="search"
          aria-label="Dashboard search"
          onSubmit={handleSearchSubmit}
          className="mt-3 lg:hidden"
        >
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search anything..."
            aria-label="Search dashboard"
            leadingIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            className="h-10 rounded-none border-[#e5e5df] bg-white text-sm shadow-sm shadow-zinc-950/[0.02] placeholder:text-[#9a9288]"
          />
        </form>
      </div>
    </header>
  );
}

function getHeaderMeta(pathname: string) {
  if (pathname.startsWith("/dashboard/cvs")) {
    return {
      section: "Library",
      mode: "CV source",
      status: "documents",
    };
  }

  if (pathname.startsWith("/dashboard/analyze")) {
    return {
      section: "AI tools",
      mode: "Audit",
      status: "analysis",
    };
  }

  if (pathname.startsWith("/dashboard/match")) {
    return {
      section: "AI tools",
      mode: "Matching",
      status: "comparison",
    };
  }

  if (pathname.startsWith("/dashboard/cover-letter")) {
    return {
      section: "AI tools",
      mode: "Draft",
      status: "cover letter",
    };
  }

  if (pathname.startsWith("/dashboard/history")) {
    return {
      section: "Workspace",
      mode: "History",
      status: "saved results",
    };
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return {
      section: "Workspace",
      mode: "Settings",
      status: "preferences",
    };
  }

  return {
    section: "Dashboard",
    mode: "Overview",
    status: "workspace",
  };
}
