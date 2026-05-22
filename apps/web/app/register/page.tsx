"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import { ApiClientError, apiClient } from "../../lib/api";

type RegisterStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function RegisterPage() {
  const [status, setStatus] = useState<RegisterStatus>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    setStatus({ type: "idle" });

    try {
      await apiClient.request("/auth/register", {
        method: "POST",
        body: {
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        },
      });

      setStatus({
        type: "success",
        message: "Account created successfully. You can log in when login is available.",
      });
      form.reset();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof ApiClientError
            ? error.error.message
            : "Registration failed. Please try again.",
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
              New workspace
            </p>
            <h1 className="mt-5 max-w-[9ch] font-serif text-[clamp(4rem,12vw,8rem)] leading-[0.86] tracking-[-0.06em]">
              Create your account
            </h1>
            <p className="mt-8 max-w-md text-lg leading-8 text-[#5f5f58]">
              Start tracking and improving your CV for focused job
              applications.
            </p>
          </div>
          <p className="mt-12 hidden max-w-xs text-xs font-bold uppercase leading-snug tracking-[0.16em] text-[#6f6f68] md:block">
            Upload. Analyze. Match. Save the decisions that matter.
          </p>
        </section>

        <section className="col-span-12 self-center md:col-span-5 md:col-start-8">
          <div className="border border-[#171717]/10 bg-white p-6 md:p-8">
            <div className="mb-8 border-b border-[#171717]/10 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6f6f68]">
                Setup
              </p>
              <p className="mt-3 font-serif text-3xl leading-none tracking-[-0.04em]">
                Open a focused CV system.
              </p>
            </div>

            <form
              aria-label="Register form"
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#6f6f68]"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="mt-2 block h-12 w-full border border-[#cfcfc8] bg-[#f7f7f4] px-3 text-[#171717] outline-none transition hover:bg-white focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/10"
                />
              </div>

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
                  className="mt-2 block h-12 w-full border border-[#cfcfc8] bg-[#f7f7f4] px-3 text-[#171717] outline-none transition hover:bg-white focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/10"
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
                  autoComplete="new-password"
                  required
                  className="mt-2 block h-12 w-full border border-[#cfcfc8] bg-[#f7f7f4] px-3 text-[#171717] outline-none transition hover:bg-white focus:border-[#171717] focus:bg-white focus:ring-2 focus:ring-[#171717]/10"
                />
              </div>

              {status.type === "success" ? (
                <p
                  role="status"
                  className="border border-[#cfcfc8] bg-[#f7f7f4] px-3 py-2 text-sm text-[#171717]"
                >
                  {status.message}
                </p>
              ) : null}

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
                {isSubmitting ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#5f5f58]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#171717] underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
