"use client";

import { Upload } from "lucide-react";
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
    <section
      id="add-new-cv"
      className="border border-[#d8d2c5] bg-[#ffffff] p-5 shadow-sm shadow-zinc-950/[0.02]"
    >
      <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#171717] text-white">
          <Upload className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[0.7rem] font-bold uppercase text-[#6f6f68]">
            Add new CV
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#171717]">
            Upload CV
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f5f58]">
            Add a fresh source document when you have a new draft, a tailored
            version, or a role-specific CV.
          </p>
        </div>
      </div>

      <form
        aria-label="Upload CV form"
        className="mt-5 flex gap-4 flex-col"
        onSubmit={handleSubmit}
      >
        <div>
          <label
            htmlFor="file"
            className="block text-xs font-semibold uppercase text-[#5f5f58]"
          >
            CV file
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept={acceptedCvFileTypes}
            required
            className="mt-2 block w-full cursor-pointer border border-dashed border-[#cfcfc8] bg-[#f7f7f4] px-3 py-4 text-sm text-[#171717] outline-none transition file:mr-3 file:border-0 file:bg-[#171717] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:border-[#171717] hover:bg-white focus:border-[#171717]"
          />
          <p className="mt-2 text-xs leading-5 text-[#6f6f68]">
            Supported formats: PDF, DOC, DOCX.
          </p>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#171717] px-4 text-sm font-semibold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a] lg:w-auto"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {isUploading ? "Uploading..." : "Upload CV"}
        </button>

        {status.type === "success" ? (
          <p
            role="status"
            className="border border-[#cfcfc8] bg-[#f1f1ee] px-3 py-2 text-sm text-[#343430] lg:col-span-2"
          >
            {status.message}
          </p>
        ) : null}

        {status.type === "error" ? (
          <p
            role="alert"
            className="border border-[#e7d8cf] bg-[#fff7f2] px-3 py-2 text-sm text-[#8a3f24] lg:col-span-2"
          >
            {status.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
