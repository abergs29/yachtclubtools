import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function currency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function RecentTradesPage() {
  const recentTrades = await prisma.trade.findMany({
    orderBy: { date: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Recent Trades</h1>
        <p className="text-zinc-600">
          Latest trades imported from Fidelity history or custom trade uploads.
        </p>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Trade Ledger</h2>
          <p className="text-sm text-zinc-500">Showing {recentTrades.length} rows</p>
        </div>
        {recentTrades.length === 0 ? (
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
                {recentTrades.map((trade) => (
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
