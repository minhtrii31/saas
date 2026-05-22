"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import type { AuthUser } from "@/lib/api";

import { DashboardNav } from "./dashboard-nav";
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
    <main className="min-h-screen bg-zinc-50">
      <DashboardNav onLogout={handleLogout} />
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div>
          <p className="text-sm font-medium text-zinc-500">CV Assistant</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              {description}
            </p>
          ) : null}
        </div>

        {state.type === "loading" ? (
          <div
            role="status"
            className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm"
          >
            Loading dashboard...
          </div>
        ) : null}

        {state.type === "error" ? (
          <p
            role="alert"
            className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.message}
          </p>
        ) : null}

        {state.type === "ready" ? children(state) : null}
      </section>
    </main>
  );
}
