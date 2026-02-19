export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <main className="w-full max-w-4xl space-y-8 px-6 py-16">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Yacht Club Tools
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900">
            Investment Club Command Center
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            Centralize monthly updates, holdings, and research so every member can
            see the latest performance and ownership in one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <a
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white"
          >
            View Monthly Update
          </a>
          <a
            href="/holdings"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900"
          >
            View Holdings
          </a>
          <a
            href="/admin/monthly-update"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900"
          >
            Admin Tools
          </a>
          <a
            href="/admin/trades"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900"
          >
            Recent Trades
          </a>
        </div>
      </main>
    </div>
  );
}
