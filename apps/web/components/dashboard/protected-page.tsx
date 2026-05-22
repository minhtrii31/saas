"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import type { AuthUser } from "@/lib/api";

import { Sidebar } from "@/components/ui/sidebar";
import { TopHeader } from "@/components/ui/top-header";
import { getApiErrorMessage, validateSession } from "./api";

type ProtectedPageState =
  | { type: "loading" }
  | { type: "ready"; token: string; user: AuthUser }
  | { type: "error"; message: string };

export function ProtectedPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: (context: { token: string; user: AuthUser }) => ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<ProtectedPageState>({ type: "loading" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    async function loadUser() {
      try {
        const user = await validateSession(accessToken);

        if (isActive) {
          setState({ type: "ready", token: accessToken, user });
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof Error) {
          redirectToLogin();
          return;
        }

        setState({
          type: "error",
          message: getApiErrorMessage(error, "Unable to load this page."),
        });
      }
    }

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [redirectToLogin]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#fbfbfa]">
      <Sidebar
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        onLogout={handleLogout}
      />
      <section className="lg:pl-[15.5rem]">
        <TopHeader
          title={title}
          description={description}
          user={state.type === "ready" ? state.user : undefined}
          onLogout={handleLogout}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />

        <div className="dashboard-page">
          {state.type === "loading" ? (
            <div
              role="status"
              className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm"
            >
              Loading dashboard...
            </div>
          ) : null}

          {state.type === "error" ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {state.message}
            </p>
          ) : null}

          {state.type === "ready" ? children(state) : null}
        </div>
      </section>
    </main>
  );
}
