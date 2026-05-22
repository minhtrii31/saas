"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  fetchCvs,
  getApiErrorMessage,
  isUnauthorizedError,
} from "@/components/dashboard/api";
import { CvList } from "@/components/dashboard/cvs/cv-list";
import { CvUploadForm } from "@/components/dashboard/cvs/cv-upload-form";
import { ProtectedPage } from "@/components/dashboard/protected-page";
import type { CvItem } from "@/lib/api";

type CvsState =
  | { type: "loading" }
  | { type: "ready"; cvs: CvItem[] }
  | { type: "error"; message: string };

export default function CvsPage() {
  return (
    <ProtectedPage
      title="CVs"
      description="Upload CV files and manage your saved CV library."
    >
      {({ token }) => <CvsContent token={token} />}
    </ProtectedPage>
  );
}

function CvsContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<CvsState>({ type: "loading" });

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }, [router]);

  async function loadCvs() {
    try {
      const cvs = await fetchCvs(token);
      setState({ type: "ready", cvs });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        handleUnauthorized();
        return;
      }

      setState({
        type: "error",
        message: getApiErrorMessage(error, "Unable to load CVs. Please try again."),
      });
    }
  }

  async function handleRefresh() {
    setState({ type: "loading" });
    await loadCvs();
  }

  useEffect(() => {
    let isActive = true;

    async function loadInitialCvs() {
      try {
        const cvs = await fetchCvs(token);

        if (isActive) {
          setState({ type: "ready", cvs });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (isUnauthorizedError(error)) {
          handleUnauthorized();
          return;
        }

        setState({
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
  }, [handleUnauthorized, token]);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-zinc-950">Saved CVs</h2>
          <button
            type="button"
            onClick={() => {
              void handleRefresh();
            }}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
          >
            Refresh
          </button>
        </div>

        {state.type === "loading" ? (
          <p role="status" className="mt-6 text-sm text-zinc-600">
            Loading CVs...
          </p>
        ) : null}

        {state.type === "error" ? (
          <p
            role="alert"
            className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.message}
          </p>
        ) : null}

        {state.type === "ready" ? <CvList cvs={state.cvs} /> : null}
      </section>

      <CvUploadForm
        token={token}
        onUploaded={loadCvs}
        onUnauthorized={handleUnauthorized}
      />
    </div>
  );
}
