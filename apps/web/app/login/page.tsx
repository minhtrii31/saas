import Link from "next/link";

export default function LoginPage() {
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

        <form aria-label="Login form" className="space-y-5">
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
              className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Log in
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
