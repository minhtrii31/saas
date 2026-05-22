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

      localStorage.setItem("accessToken", response.data.accessToken);
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
    <main className="min-h-screen bg-[#f7f7f4] px-6 py-8 text-[#171717] md:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-screen-2xl grid-cols-12 gap-x-6 gap-y-10">
        <section className="col-span-12 flex flex-col justify-between border-b border-[#171717]/10 pb-10 md:col-span-6 md:border-b-0 md:border-r md:pb-0 md:pr-10">
          <Link
            href="/"
            className="w-fit text-[11px] font-bold uppercase tracking-[0.22em]"
          >
            Nyx
          </Link>
          <div className="mt-16 md:mt-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
              Returning workspace
            </p>
            <h1 className="mt-5 max-w-[8ch] font-serif text-[clamp(4rem,12vw,8rem)] leading-[0.86] tracking-[-0.06em]">
              Log in
            </h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-[#5f5f58]">
              Continue to your CV analysis workspace and pick up the next
              application decision.
            </p>
          </div>
          <p className="mt-12 hidden max-w-xs text-xs font-bold uppercase leading-snug tracking-[0.16em] text-[#6f6f68] md:block">
            Structured feedback. Clear role signals. User-controlled output.
          </p>
        </section>

        <section className="col-span-12 self-center md:col-span-5 md:col-start-8">
          <div className="border border-[#171717]/10 bg-white p-6 md:p-8">
            <div className="mb-8 border-b border-[#171717]/10 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
                Access
              </p>
              <p className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em]">
                Open your dashboard.
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
                  className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-2 block h-12 w-full border border-[#cfcfc8] bg-[#f7f7f4] px-3 text-[#171717] outline-none transition placeholder:text-[#6f6f68] hover:bg-white focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 block h-12 w-full border border-[#cfcfc8] bg-[#f7f7f4] px-3 text-[#171717] outline-none transition hover:bg-white focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/10"
                />
              </div>

              {status.type === "error" ? (
                <p
                  role="alert"
                  className="border border-[#cfcfc8] bg-[#f7f7f4] px-3 py-2 text-sm text-[#171717]"
                >
                  {status.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-12 w-full bg-[#171717] px-4 text-sm font-bold text-white transition hover:bg-[#2b2926] disabled:cursor-not-allowed disabled:bg-[#a1a19a]"
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5f5f58]">
              New here?{" "}
              <Link
                href="/register"
                className="font-semibold text-[#171717] underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
