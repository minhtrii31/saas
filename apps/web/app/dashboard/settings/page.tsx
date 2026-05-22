"use client";

import { Bell, CheckCircle2, KeyRound, Settings, Shield } from "lucide-react";

import { ControlCard } from "@/components/dashboard/control-card";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import { WorkspaceHero } from "@/components/dashboard/workspace-hero";

const availableControls = [
  {
    icon: Shield,
    title: "Protected workspace",
    description: "Dashboard pages require an active session before user data loads.",
    status: "Active",
  },
  {
    icon: KeyRound,
    title: "Provider abstraction",
    description: "AI workflows stay behind the API layer instead of coupling UI to one provider.",
    status: "Designed",
  },
];

const plannedControls = [
  {
    icon: Settings,
    title: "Workspace preferences",
    description: "Default analysis behavior and dashboard display settings.",
  },
  {
    icon: Bell,
    title: "Activity notifications",
    description: "Future alerts for completed analyses and generated drafts.",
  },
];

export default function SettingsPage() {
  return (
    <ProtectedPage
      title="Settings"
      description="Manage workspace preferences and account settings."
    >
      {() => (
        <div className="space-y-5">
          <WorkspaceHero
            eyebrow="Workspace settings"
            title="Small control surface. Clear ownership."
            description="The MVP keeps settings focused on what protects the core CV workflow. More controls should earn their place by improving upload, analysis, matching, or drafting."
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="border border-[#e5e5df] bg-white p-5">
              <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
                Available now
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {availableControls.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="border border-[#e5e5df] bg-[#f7f7f4] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#171717]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {item.status}
                        </span>
                      </div>
                      <h3 className="mt-5 text-sm font-semibold text-[#171717]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#5f5f58]">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="border border-[#e5e5df] bg-[#171717] p-5 text-white">
              <p className="text-[0.7rem] font-bold uppercase text-white/55">
                Settings principle
              </p>
              <h3 className="mt-3 font-serif text-3xl leading-[0.95] tracking-[-0.04em]">
                Add controls only when they reduce work.
              </h3>
              <p className="mt-5 text-sm leading-6 text-white/65">
                This page should stay quiet until a setting changes a real user
                decision or removes repeated effort.
              </p>
            </aside>
          </section>

          <section className="border border-[#e5e5df] bg-white p-5">
            <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
              Planned controls
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {plannedControls.map((item) => (
                <ControlCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  status="Planned"
                  dashed
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPage>
  );
}
