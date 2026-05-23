"use client";

import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { ProtectedPage } from "@/components/dashboard/protected-page";

const preferenceItems = [
  {
    icon: LayoutDashboard,
    title: "Dashboard focus",
    description:
      "Nyx keeps your workspace centered on CVs, target roles, and applications.",
  },
  {
    icon: Sparkles,
    title: "AI actions",
    description: "Credits are used when an AI workflow completes successfully.",
  },
];

const comingSoonItems = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Simple alerts for important workspace activity.",
  },
  {
    icon: SlidersHorizontal,
    title: "Workflow preferences",
    description: "Saved choices for repeated CV and job-target tasks.",
  },
  {
    icon: CheckCircle2,
    title: "Saved defaults",
    description: "Reusable defaults for focused application workflows.",
  },
];

export default function SettingsPage() {
  return (
    <ProtectedPage
      title="Settings"
      description="Manage your account, workspace preferences, and AI usage settings."
    >
      {({ user }) => {
        const displayName = user.name || user.email;
        const creditBalance =
          typeof user.creditBalance === "number"
            ? user.creditBalance.toLocaleString()
            : "Unavailable";
        const creditLabel =
          typeof user.creditBalance === "number"
            ? `${creditBalance} credits`
            : creditBalance;

        return (
          <div className="mx-auto space-y-5">
            <section
              aria-labelledby="settings-summary-heading"
              className="overflow-hidden border border-[#e5e5df] bg-[#171717] text-white"
            >
              <div className="grid gap-px bg-white/10 lg:grid-cols-[minmax(0,1fr)_15rem_15rem]">
                <div className="bg-[#171717] p-5 md:p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
                    Workspace state
                  </p>
                  <h2
                    id="settings-summary-heading"
                    className="mt-3 max-w-2xl font-serif text-4xl leading-[0.95] text-white md:text-5xl"
                  >
                    A focused setup for better applications.
                  </h2>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-white/65">
                    Nyx keeps settings quiet until a preference changes a real
                    workflow. Your account, session, and AI usage are the
                    controls that matter today.
                  </p>
                </div>

                <SummaryTile
                  icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                  label="Session"
                  value="Active"
                  detail={user.email}
                />
                <SummaryTile
                  icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
                  label="Credits"
                  value={creditLabel}
                  detail="Used after completed AI actions"
                />
              </div>
            </section>

            <section
              aria-labelledby="account-heading"
              className="border border-[#e5e5df] bg-white p-5 md:p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                    Account
                  </p>
                  <h2
                    id="account-heading"
                    className="mt-2 text-xl font-semibold text-[#171717]"
                  >
                    {displayName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
                    Your account is signed in and ready for the current
                    workspace.
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 border border-[#d9e6d3] bg-[#f5faf2] px-3 py-2 text-sm font-semibold text-[#315c25]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Active session
                </span>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="border border-[#e5e5df] bg-[#f7f7f4] p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Signed-in email
                  </dt>
                  <dd className="mt-3 break-words text-sm font-semibold text-[#171717]">
                    {user.email}
                  </dd>
                </div>
                <div className="border border-[#e5e5df] bg-[#f7f7f4] p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6f6f68]">
                    Workspace status
                  </dt>
                  <dd className="mt-3 text-sm font-semibold text-[#171717]">
                    Personal workspace
                  </dd>
                </div>
              </dl>
            </section>

            <section
              aria-labelledby="credits-heading"
              className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"
            >
              <div className="border border-[#e5e5df] bg-white p-5 md:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                  Credits
                </p>
                <h2
                  id="credits-heading"
                  className="mt-2 text-xl font-semibold text-[#171717]"
                >
                  AI usage visibility
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5f58]">
                  Nyx uses credits for completed AI workflows, including CV
                  analysis, role matching, cover letters, interview prep, resume
                  rewrites, and follow-up drafts.
                </p>
              </div>

              <aside className="border border-[#e5e5df] bg-[#171717] p-5 text-white">
                <div className="flex items-center gap-2 text-white/60">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
                    Remaining
                  </p>
                </div>
                <p className="mt-4 text-3xl font-semibold">{creditLabel}</p>
                <button
                  type="button"
                  disabled
                  className="mt-5 inline-flex min-h-10 w-full cursor-not-allowed items-center justify-center border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white/75"
                >
                  Billing coming soon
                </button>
              </aside>
            </section>

            <section
              aria-labelledby="preferences-heading"
              className="border border-[#e5e5df] bg-white p-5 md:p-6"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                Workspace preferences
              </p>
              <h2
                id="preferences-heading"
                className="mt-2 text-xl font-semibold text-[#171717]"
              >
                Simple by design
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5f58]">
                Settings stay limited to choices that reduce repeated work or
                make the workspace clearer.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {preferenceItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="border border-[#e5e5df] bg-[#f7f7f4] p-4"
                    >
                      <Icon
                        className="h-4 w-4 text-[#6f6f68]"
                        aria-hidden="true"
                      />
                      <div className="mt-4 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-[#171717]">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
                            {item.description}
                          </p>
                        </div>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-[#a1a19a]"
                          aria-hidden="true"
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section
              aria-labelledby="coming-soon-heading"
              className="border border-dashed border-[#cfcfc8] bg-[#f7f7f4] p-5 md:p-6"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]">
                    Coming soon
                  </p>
                  <h2
                    id="coming-soon-heading"
                    className="mt-2 text-xl font-semibold text-[#171717]"
                  >
                    Focused controls as Nyx grows
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-[#5f5f58]">
                  These will stay compact and tied to real workflow needs.
                </p>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {comingSoonItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="bg-white p-4">
                      <Icon
                        className="h-4 w-4 text-[#6f6f68]"
                        aria-hidden="true"
                      />
                      <h3 className="mt-3 text-sm font-semibold text-[#171717]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        );
      }}
    </ProtectedPage>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="bg-[#1f1f1c] p-5">
      <div className="flex items-center gap-2 text-white/55">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
          {label}
        </p>
      </div>
      <p className="mt-5 break-words text-2xl font-semibold text-white">
        {value}
      </p>
      <p className="mt-3 break-words text-sm leading-6 text-white/55">
        {detail}
      </p>
    </div>
  );
}
