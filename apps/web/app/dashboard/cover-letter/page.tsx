"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import {
  fetchCvs,
  generateCoverLetter,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { CoverLetterResultPanel } from "@/components/dashboard/cover-letter/cover-letter-result";
import { CvSelector } from "@/components/dashboard/cv-selector";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import type { CoverLetterResult, CvItem } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

type CoverLetterState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; result: CoverLetterResult; copied: boolean }
  | { type: "error"; message: string };

export default function CoverLetterPage() {
  return (
    <ProtectedPage
      title="Cover Letter"
      description="Select one CV and generate a tailored cover letter draft."
    >
      {({ token }) => <CoverLetterContent token={token} />}
    </ProtectedPage>
  );
}

function CoverLetterContent({ token }: { token: string }) {
  const router = useRouter();
  const [cvsState, setCvsState] = useState<CvsState>({ type: "loading" });
  const [selectedCvId, setSelectedCvId] = useState("");
  const [coverLetterState, setCoverLetterState] =
    useState<CoverLetterState>({ type: "idle" });

  useEffect(() => {
    let isActive = true;

    async function loadCvs() {
      try {
        const cvs = await fetchCvs(token);

        if (!isActive) {
          return;
        }

        setCvsState({ type: "ready", cvs });
        setSelectedCvId((current) => current || cvs[0]?.id || "");
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }

        setCvsState({
          type: "error",
          message: getApiErrorMessage(error, "Unable to load CVs. Please try again."),
        });
      }
    }

    void loadCvs();

    return () => {
      isActive = false;
    };
  }, [router, token]);

  const selectedCv = useMemo(() => {
    return cvsState.type === "ready"
      ? cvsState.cvs.find((cv) => cv.id === selectedCvId)
      : undefined;
  }, [cvsState, selectedCvId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const jobDescriptionText = formData.get("jobDescriptionText");
    const companyName = formData.get("companyName");
    const roleTitle = formData.get("roleTitle");
    const trimmedJobDescriptionText =
      typeof jobDescriptionText === "string" ? jobDescriptionText.trim() : "";
    const trimmedCompanyName =
      typeof companyName === "string" ? companyName.trim() : "";
    const trimmedRoleTitle =
      typeof roleTitle === "string" ? roleTitle.trim() : "";

    if (!trimmedJobDescriptionText) {
      setCoverLetterState({
        type: "error",
        message: "Enter a job description before generating a cover letter.",
      });
      return;
    }

    if (!selectedCvId) {
      setCoverLetterState({
        type: "error",
        message: "Select a CV before generating a cover letter.",
      });
      return;
    }

    setCoverLetterState({ type: "loading" });

    try {
      const result = await generateCoverLetter(token, selectedCvId, {
        jobDescriptionText: trimmedJobDescriptionText,
        ...(trimmedCompanyName ? { companyName: trimmedCompanyName } : {}),
        ...(trimmedRoleTitle ? { roleTitle: trimmedRoleTitle } : {}),
      });

      setCoverLetterState({ type: "success", result, copied: false });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        localStorage.removeItem("accessToken");
        router.replace("/login");
        return;
      }

      setCoverLetterState({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to generate a cover letter. Please try again.",
        ),
      });
    }
  }

  async function handleCopy() {
    if (coverLetterState.type !== "success") {
      return;
    }

    if (!navigator.clipboard) {
      setCoverLetterState({
        type: "error",
        message: "Copy is not available in this browser.",
      });
      return;
    }

    await navigator.clipboard.writeText(coverLetterState.result.coverLetter);
    setCoverLetterState({ ...coverLetterState, copied: true });
  }

  return (
    <div className="mt-8 max-w-3xl">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-950">Generate draft</h2>

        {cvsState.type === "loading" ? (
          <p role="status" className="mt-6 text-sm text-zinc-600">
            Loading CVs...
          </p>
        ) : null}

        {cvsState.type === "error" ? (
          <p
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {cvsState.message}
          </p>
        ) : null}

        {cvsState.type === "ready" ? (
          <form className="mt-6 space-y-4" noValidate onSubmit={handleSubmit}>
            <CvSelector
              cvs={cvsState.cvs}
              selectedCvId={selectedCvId}
              onChange={(cvId) => {
                setSelectedCvId(cvId);
                setCoverLetterState({ type: "idle" });
              }}
            />
            <div>
              <label
                htmlFor="jobDescriptionText"
                className="block text-sm font-medium text-zinc-800"
              >
                Job description
              </label>
              <textarea
                id="jobDescriptionText"
                name="jobDescriptionText"
                rows={8}
                required
                className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                placeholder="Paste the role requirements, responsibilities, and required skills."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-zinc-800"
                >
                  Company name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label
                  htmlFor="roleTitle"
                  className="block text-sm font-medium text-zinc-800"
                >
                  Role title
                </label>
                <input
                  id="roleTitle"
                  name="roleTitle"
                  type="text"
                  className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  placeholder="Optional"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={
                coverLetterState.type === "loading" || cvsState.cvs.length === 0
              }
              className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {coverLetterState.type === "loading"
                ? "Generating..."
                : "Generate"}
            </button>
          </form>
        ) : null}

        {coverLetterState.type === "loading" ? (
          <p role="status" className="mt-4 text-sm text-zinc-600">
            Generating a cover letter for{" "}
            {selectedCv?.title || selectedCv?.originalName || "CV"}...
          </p>
        ) : null}

        {coverLetterState.type === "error" ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {coverLetterState.message}
          </p>
        ) : null}
      </section>

      {coverLetterState.type === "success" ? (
        <CoverLetterResultPanel
          result={coverLetterState.result}
          cvTitle={selectedCv?.title || selectedCv?.originalName || "CV"}
          copied={coverLetterState.copied}
          onCopy={() => {
            void handleCopy();
          }}
        />
      ) : null}
    </div>
  );
}
