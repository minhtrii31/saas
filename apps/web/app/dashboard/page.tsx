"use client";

import Link from "next/link";

import { ProtectedPage } from "@/components/dashboard/protected-page";

const tasks = [
  {
    href: "/dashboard/cvs",
    title: "Manage CVs",
    description: "Upload CV files and review your saved library.",
  },
  {
    href: "/dashboard/analyze",
    title: "Analyze a CV",
    description: "Select one uploaded CV and get structured improvement advice.",
  },
  {
    href: "/dashboard/match",
    title: "Match a job",
    description: "Compare a selected CV with a pasted job description.",
  },
  {
    href: "/dashboard/cover-letter",
    title: "Generate a cover letter",
    description: "Create a tailored draft from a CV and job description.",
  },
  {
    href: "/dashboard/history",
    title: "View history",
    description: "Review saved analyses, matches, and cover letters.",
  },
];

export default function DashboardPage() {
  return (
    <ProtectedPage title="Dashboard" description="Choose the task you want to complete.">
      {({ user }) => {
        const displayName = user.name || user.email;

        return (
          <div className="mt-8 space-y-6">
            <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-zinc-500">Signed in as</p>
              <h2 className="mt-2 text-xl font-semibold text-zinc-950">
                {displayName}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
            </section>

            <section aria-label="Dashboard tasks">
              <div className="grid gap-4 md:grid-cols-2">
                {tasks.map((task) => (
                  <Link
                    key={task.href}
                    href={task.href}
                    className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <h3 className="text-base font-semibold text-zinc-950">
                      {task.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                      {task.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        );
      }}
    </ProtectedPage>
  );
}
