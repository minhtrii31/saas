"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/cvs", label: "CVs" },
  { href: "/dashboard/analyze", label: "Analyze" },
  { href: "/dashboard/match", label: "Match" },
  { href: "/dashboard/cover-letter", label: "Cover letter" },
  { href: "/dashboard/history", label: "History" },
];

export function DashboardNav({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/dashboard" className="text-base font-semibold text-zinc-950">
          CV Assistant
        </Link>
        <nav aria-label="Dashboard navigation" className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={onLogout}
          className="w-fit rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
