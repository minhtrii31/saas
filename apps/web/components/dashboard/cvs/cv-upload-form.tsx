"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { getApiErrorMessage, isUnauthorizedError, uploadCv } from "../api";

type UploadStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const acceptedCvFileTypes =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function CvUploadForm({
  token,
  onUploaded,
  onUnauthorized,
}: {
  token: string;
  onUploaded: () => Promise<void>;
  onUnauthorized: () => void;
}) {
  const [status, setStatus] = useState<UploadStatus>({ type: "idle" });
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setStatus({
        type: "error",
        message: "Choose a CV file before uploading.",
      });
      return;
    }

    setIsUploading(true);
    setStatus({ type: "idle" });

    try {
      await uploadCv(token, formData);
      await onUploaded();
      form.reset();
      setStatus({
        type: "success",
        message: "CV uploaded successfully.",
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        onUnauthorized();
        return;
      }

      setStatus({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to upload CV. Please try again.",
        ),
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-950">Upload CV</h2>

      <form
        aria-label="Upload CV form"
        className="mt-6 space-y-4"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-zinc-800">
            CV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept={acceptedCvFileTypes}
            required
            className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Supported formats: PDF, DOC, DOCX.
          </p>
        </div>

        {status.type === "success" ? (
          <p
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            {status.message}
          </p>
        ) : null}

        {status.type === "error" ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isUploading}
          className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isUploading ? "Uploading..." : "Upload CV"}
        </button>
      </form>
    </section>
  );
}
