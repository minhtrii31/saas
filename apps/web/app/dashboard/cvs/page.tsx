"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { ApiClientError, apiClient } from "../../../lib/api";
import type { AuthUser, CvItem } from "../../../lib/api";

type PageStatus =
  | { type: "loading" }
  | { type: "ready" }
  | { type: "error"; message: string };

type UploadStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

type AuthMeResponse = {
  user: AuthUser;
};

const acceptedCvFileTypes = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export default function CvsPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CvItem[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>({
    type: "loading",
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    type: "idle",
  });
  const [isUploading, setIsUploading] = useState(false);

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let isActive = true;
    const token = localStorage.getItem("accessToken");

    if (!token) {
      redirectToLogin();
      return;
    }

    const accessToken = token;

    async function loadInitialCvs() {
      try {
        await validateSession(accessToken);
        const nextCvs = await fetchCvs(accessToken);

        if (isActive) {
          setCvs(nextCvs);
          setPageStatus({ type: "ready" });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          redirectToLogin();
          return;
        }

        setPageStatus({
          type: "error",
          message: getApiErrorMessage(
            error,
            "Unable to load CVs. Please try again.",
          ),
        });
      }
    }

    void loadInitialCvs();

    return () => {
      isActive = false;
    };
  }, [redirectToLogin]);

  async function handleRefresh() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      redirectToLogin();
      return;
    }

    setPageStatus({ type: "loading" });

    try {
      const nextCvs = await fetchCvs(token);

      setCvs(nextCvs);
      setPageStatus({ type: "ready" });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectToLogin();
        return;
      }

      setPageStatus({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to load CVs. Please try again.",
        ),
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("accessToken");

    if (!token) {
      redirectToLogin();
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setUploadStatus({
        type: "error",
        message: "Choose a CV file before uploading.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: "idle" });

    try {
      await apiClient.request<CvItem>("/cvs/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setUploadStatus({
        type: "success",
        message: "CV uploaded successfully.",
      });
      form.reset();
      setCvs(await fetchCvs(token));
      setPageStatus({ type: "ready" });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        redirectToLogin();
        return;
      }

      setUploadStatus({
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
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">CV Assistant</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              CVs
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Upload and review your saved CV files.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-zinc-950">
                Saved CVs
              </h2>
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
              >
                Refresh
              </button>
            </div>

            {pageStatus.type === "loading" ? (
              <p role="status" className="mt-6 text-sm text-zinc-600">
                Loading CVs...
              </p>
            ) : null}

            {pageStatus.type === "error" ? (
              <p
                role="alert"
                className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {pageStatus.message}
              </p>
            ) : null}

            {pageStatus.type === "ready" && cvs.length === 0 ? (
              <div className="mt-6 rounded-md border border-dashed border-zinc-300 p-6 text-sm text-zinc-600">
                No CVs yet. Upload your first CV to start your library.
              </div>
            ) : null}

            {pageStatus.type === "ready" && cvs.length > 0 ? (
              <ul className="mt-6 divide-y divide-zinc-200">
                {cvs.map((cv) => (
                  <li key={cv.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-950">
                          {cv.title || cv.originalName}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {cv.originalName}
                        </p>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {formatBytes(cv.sizeBytes)}
                      </p>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-zinc-800">Type</dt>
                        <dd>{cv.mimeType}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-zinc-800">Storage</dt>
                        <dd>{cv.storageProvider}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-medium text-zinc-800">Key</dt>
                        <dd className="break-all">{cv.storageKey}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-950">
              Upload CV
            </h2>

            <form
              aria-label="Upload CV form"
              className="mt-6 space-y-4"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-zinc-800"
                >
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

              {uploadStatus.type === "success" ? (
                <p
                  role="status"
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                >
                  {uploadStatus.message}
                </p>
              ) : null}

              {uploadStatus.type === "error" ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {uploadStatus.message}
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
        </div>
      </section>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

async function validateSession(token: string) {
  await apiClient.request<AuthMeResponse>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function fetchCvs(token: string) {
  const response = await apiClient.request<CvItem[]>("/cvs", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.error.message : fallback;
}
