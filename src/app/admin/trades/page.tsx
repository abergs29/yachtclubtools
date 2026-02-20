import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function currency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseDateParam(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDateParam(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default async function TradeLedgerPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const symbolParam =
    typeof searchParams?.symbol === "string" ? searchParams?.symbol.trim() : "";
  const fromParam =
    typeof searchParams?.from === "string" ? searchParams?.from.trim() : "";
  const toParam =
    typeof searchParams?.to === "string" ? searchParams?.to.trim() : "";

  const fromDate = parseDateParam(fromParam);
  const toDate = parseEndDateParam(toParam);

  const where: Prisma.TradeWhereInput = {};
  if (symbolParam) {
    where.ticker = {
      contains: symbolParam.toUpperCase(),
      mode: "insensitive",
    };
  }
  if (fromDate || toDate) {
    where.date = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  const [trades, totalCount, filteredCount] = await Promise.all([
    prisma.trade.findMany({
      where,
      orderBy: { date: "desc" },
    }),
    prisma.trade.count(),
    prisma.trade.count({ where }),
  ]);

  const filtersActive = Boolean(symbolParam || fromParam || toParam);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Trade Ledger</h1>
        <p className="text-zinc-600">
          All trades imported from Fidelity history. Filter by date or ticker to narrow the ledger.
        </p>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Trade Ledger</h2>
            <p className="text-sm text-zinc-500">
              {filtersActive
                ? `Showing ${filteredCount} of ${totalCount} trades`
                : `Showing ${totalCount} trades`}
            </p>
          </div>
          <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
            <label className="flex flex-col gap-1 text-zinc-600">
              Symbol
              <input
                type="text"
                name="symbol"
                value={symbolParam}
                placeholder="e.g. AAPL"
                className="w-36 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-zinc-600">
              From
              <input
                type="date"
                name="from"
                value={fromParam}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-zinc-600">
              To
              <input
                type="date"
                name="to"
                value={toParam}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Apply Filters
            </button>
            {filtersActive ? (
              <a
                href="/admin/trades"
                className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700"
              >
                Clear
              </a>
            ) : null}
          </form>
        </div>
        {trades.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No trades imported yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Symbol</th>
                  <th className="py-2">Action</th>
                  <th className="py-2">Shares</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Fees</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-t border-zinc-100">
                    <td className="py-2">
                      {trade.date.toLocaleDateString("en-US")}
                    </td>
                    <td className="py-2 font-medium text-zinc-900">
                      {trade.ticker}
                    </td>
                    <td className="py-2">{trade.action}</td>
                    <td className="py-2">{Number(trade.shares).toFixed(4)}</td>
                    <td className="py-2">{currency(Number(trade.price))}</td>
                    <td className="py-2">{currency(Number(trade.fees))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
