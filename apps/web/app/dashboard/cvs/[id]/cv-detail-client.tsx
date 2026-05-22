"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  fetchCv,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { formatBytes, formatDateTime } from "@/components/dashboard/format";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import type { CvItem } from "@/lib/api";

type CvDetailState =
  | { type: "loading" }
  | { type: "ready"; cv: CvItem }
  | { type: "error"; message: string };

export function CvDetailClient({ cvId }: { cvId: string }) {
  return (
    <ProtectedPage
      title="CV detail"
      description="Review file metadata and extracted text when it is available."
    >
      {({ token }) => <CvDetailContent token={token} cvId={cvId} />}
    </ProtectedPage>
  );
}

function CvDetailContent({ token, cvId }: { token: string; cvId: string }) {
  const router = useRouter();
  const [state, setState] = useState<CvDetailState>({ type: "loading" });

  useEffect(() => {
    let isActive = true;

    async function loadCv() {
      try {
        const cv = await fetchCv(token, cvId);

        if (isActive) {
          setState({ type: "ready", cv });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          localStorage.removeItem("accessToken");
          router.replace("/login");
          return;
        }

        setState({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to load CV detail. Please try again.",
          ),
        });
      }
    }

    void loadCv();

    return () => {
      isActive = false;
    };
  }, [cvId, router, token]);

  if (state.type === "loading") {
    return (
      <p role="status" className="mt-8 text-sm text-zinc-600">
        Loading CV detail...
      </p>
    );
  }

  if (state.type === "error") {
    return (
      <p
        role="alert"
        className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {state.message}
      </p>
    );
  }

  const cv = state.cv;
  const title = cv.title || cv.originalName;

  return (
    <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <dl className="mt-6 grid gap-4 text-sm text-zinc-600 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-zinc-800">Original file</dt>
          <dd>{cv.originalName}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800">Size</dt>
          <dd>{formatBytes(cv.sizeBytes)}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800">Type</dt>
          <dd>{cv.mimeType}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800">Uploaded</dt>
          <dd>{formatDateTime(cv.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800">Storage</dt>
          <dd>{cv.storageProvider}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-800">Storage URL</dt>
          <dd className="break-all">{cv.storageUrl || "Not available"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-zinc-800">Storage key</dt>
          <dd className="break-all">{cv.storageKey}</dd>
        </div>
      </dl>

      <section aria-label="Extracted text preview" className="mt-8">
        <h3 className="text-base font-semibold text-zinc-950">
          Extracted text preview
        </h3>
        {cv.extractedText ? (
          <p className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
            {cv.extractedText}
          </p>
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
            Extracted text is not available for this CV yet.
          </p>
        )}
      </section>
    </section>
  );
}
