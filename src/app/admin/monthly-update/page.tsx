import { prisma } from "@/lib/db";
import { createSnapshot } from "./actions";

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function MonthlyUpdatePage() {
  const latest = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Monthly Update</h1>
        <p className="text-zinc-600">
          Enter month-end totals to update share price, member ownership, and
          benchmark comparisons.
        </p>
      </div>

      <form
        action={createSnapshot}
        className="grid gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Month End Date
            <input
              type="date"
              name="date"
              defaultValue={latest ? formatInputDate(latest.date) : undefined}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Total Portfolio Value (USD)
            <input
              type="text"
              name="totalValue"
              defaultValue={latest ? latest.totalValue.toString() : ""}
              placeholder="125000"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Cash Value (USD)
            <input
              type="text"
              name="cashValue"
              defaultValue={latest ? latest.cashValue.toString() : ""}
              placeholder="5200"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            BTC Price (USD)
            <input
              type="text"
              name="btcPrice"
              defaultValue={latest ? latest.btcPrice.toString() : ""}
              placeholder="43800"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            S&amp;P 500 Value
            <input
              type="text"
              name="sp500Value"
              defaultValue={latest ? latest.sp500Value.toString() : ""}
              placeholder="4975.2"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              required
            />
          </label>
        </div>
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
          Notes / Since Last Meeting
          <textarea
            name="notes"
            defaultValue={latest?.notes ?? ""}
            placeholder="Key notes, trades, or research updates"
            className="min-h-[120px] rounded-xl border border-zinc-200 px-4 py-3 text-sm"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            Share price and member ownership will update based on contributions
            recorded for this month.
          </p>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white"
          >
            Save Monthly Snapshot
          </button>
        </div>
      </form>
    </div>
  );
}
