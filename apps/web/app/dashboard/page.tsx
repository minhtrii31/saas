"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient } from "../../lib/api";
import type { AuthUser } from "../../lib/api";

type AuthMeResponse = {
  user: AuthUser;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isActive = true;
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function loadUser() {
      try {
        const response = await apiClient.request<AuthMeResponse>("/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (isActive) {
          setUser(response.data.user);
        }
      } catch {
        localStorage.removeItem("accessToken");
        router.replace("/login");
      }
    }

    void loadUser();

    return () => {
      isActive = false;
    };
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    router.replace("/login");
  }

  const displayName = user?.name || user?.email;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">CV Assistant</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Dashboard
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
          >
            Log out
          </button>
        </div>

        {user ? (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Signed in as</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-950">
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
          </div>
        ) : (
          <div
            role="status"
            className="mt-8 rounded-lg border border-zinc-200 bg-white p-8 text-sm text-zinc-600 shadow-sm"
          >
            Loading dashboard...
          </div>
        )}
      </section>
    </main>
  );
}
