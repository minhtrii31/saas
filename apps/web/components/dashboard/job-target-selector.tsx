"use client";

import { BookmarkCheck } from "lucide-react";

import type { JobTargetItem } from "@/lib/api";

import { FieldLabel, SelectInput } from "../ui/form-field";

type JobTargetSelectorProps = {
  targets: JobTargetItem[];
  selectedTargetId: string;
  onChange: (targetId: string) => void;
};

export function JobTargetSelector({
  targets,
  selectedTargetId,
  onChange,
}: JobTargetSelectorProps) {
  return (
    <div>
      <FieldLabel htmlFor="jobTargetId">Saved target</FieldLabel>
      <div className="relative">
        <SelectInput
          id="jobTargetId"
          name="jobTargetId"
          value={selectedTargetId}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby="job-target-help"
          className="pr-10"
        >
          <option value="">Manual paste</option>
          {targets.map((target) => (
            <option key={target.id} value={target.id}>
              {target.title} at {target.companyName}
            </option>
          ))}
        </SelectInput>
        <BookmarkCheck
          className="pointer-events-none absolute right-8 top-3.5 h-4 w-4 text-[#6f6f68]"
          aria-hidden="true"
        />
      </div>
      <p id="job-target-help" className="mt-2 text-xs leading-5 text-[#6f6f68]">
        Select a saved target to reuse its job description, or keep manual
        paste.
      </p>
    </div>
  );
}
