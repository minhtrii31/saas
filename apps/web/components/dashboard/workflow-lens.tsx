import type { LucideIcon } from "lucide-react";

import { Eyebrow } from "@/components/ui/section-heading";
import { Surface } from "@/components/ui/surface";

export type WorkflowLensItem = {
  icon: LucideIcon;
  label: string;
};

export function WorkflowLens({
  title,
  items,
}: {
  title: string;
  items: WorkflowLensItem[];
}) {
  return (
    <Surface tone="subtle" padding="md">
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center gap-3 border border-[#e5e5df] bg-[#ffffff] px-3 py-3"
            >
              <Icon className="h-4 w-4 text-[#6f6f68]" aria-hidden="true" />
              <span className="text-sm font-medium text-[#343430]">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}
