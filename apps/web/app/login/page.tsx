"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { ApiClientError, apiClient } from "../../lib/api";
import type { AuthResponse } from "../../lib/api";

type LoginStatus = { type: "idle" } | { type: "error"; message: string };

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<LoginStatus>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const response = await apiClient.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
      });

      localStorage.setItem("accessToken", response.data.tokens.accessToken);
      router.push("/dashboard");
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof ApiClientError
            ? error.error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">CV Assistant</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            Log in
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Continue to your CV analysis workspace.
          </p>
        </div>

        <form
          aria-label="Login form"
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-zinc-800"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-800"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

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
            disabled={isSubmitting}
            className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          New here?{" "}
          <Link
            href="/register"
            className="font-medium text-zinc-950 underline"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
