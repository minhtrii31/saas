export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-zinc-500">CV Assistant</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
          Dashboard
        </h1>
        <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8">
          <h2 className="text-lg font-semibold text-zinc-950">
            Dashboard placeholder
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Your CV uploads, analysis history, and job matching workflows will
            appear here once the product flows are connected.
          </p>
        </div>
      </section>
    </main>
  );
}
