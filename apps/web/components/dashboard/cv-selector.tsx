"use client";

import type { CvItem } from "@/lib/api";

export function CvSelector({
  cvs,
  selectedCvId,
  onChange,
}: {
  cvs: CvItem[];
  selectedCvId: string;
  onChange: (cvId: string) => void;
}) {
  if (cvs.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
        Upload a CV before using this workflow.
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="cvId" className="block text-sm font-medium text-zinc-800">
        CV
      </label>
      <select
        id="cvId"
        name="cvId"
        value={selectedCvId}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
        className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      >
        {cvs.map((cv) => (
          <option key={cv.id} value={cv.id}>
            {cv.title || cv.originalName}
          </option>
        ))}
      </select>
    </div>
  );
}
