import { prisma } from "@/lib/db";

function currency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function HoldingsPage() {
  const latestPosition = await prisma.positionSnapshot.findFirst({
    orderBy: { date: "desc" },
  });
  const latestLive = await prisma.livePosition.findFirst({
    orderBy: { date: "desc" },
  });

  const positionRows = latestPosition
    ? await prisma.positionSnapshot.findMany({
        where: { date: latestPosition.date },
        orderBy: { currentValue: "desc" },
      })
    : [];

  const liveRows = latestLive
    ? await prisma.livePosition.findMany({
        where: { date: latestLive.date },
        orderBy: { marketValue: "desc" },
      })
    : [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Yacht Club
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Holdings</h1>
        <p className="text-zinc-600">
          Latest positions snapshot and live‑price metrics.
        </p>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Fidelity Positions</h2>
          {latestPosition ? (
            <p className="text-sm text-zinc-500">
              As of {latestPosition.date.toLocaleDateString("en-US")}
            </p>
          ) : null}
        </div>
        {positionRows.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No positions imported yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Symbol</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Last Price</th>
                  <th className="py-2">Current Value</th>
                  <th className="py-2">Total Gain/Loss</th>
                  <th className="py-2">% of Account</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {positionRows.map((row) => (
                  <tr key={`${row.id}`} className="border-t border-zinc-100">
                    <td className="py-2 font-medium text-zinc-900">
                      {row.symbol}
                    </td>
                    <td className="py-2">
                      {row.quantity !== null ? row.quantity.toString() : "—"}
                    </td>
                    <td className="py-2">
                      {currency(row.lastPrice ? Number(row.lastPrice) : null)}
                    </td>
                    <td className="py-2">
                      {currency(row.currentValue ? Number(row.currentValue) : null)}
                    </td>
                    <td className="py-2">
                      {currency(row.totalGainLoss ? Number(row.totalGainLoss) : null)}
                    </td>
                    <td className="py-2">
                      {percent(
                        row.percentOfAccount
                          ? Number(row.percentOfAccount) / 100
                          : null
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Live Prices (GoogleFinance)</h2>
          {latestLive ? (
            <p className="text-sm text-zinc-500">
              As of {latestLive.date.toLocaleDateString("en-US")}
            </p>
          ) : null}
        </div>
        {liveRows.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No live price imports yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Symbol</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Mkt Value</th>
                  <th className="py-2">Gain (%)</th>
                  <th className="py-2">% of Portfolio</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {liveRows.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-100">
                    <td className="py-2 font-medium text-zinc-900">{row.symbol}</td>
                    <td className="py-2">
                      {row.quantity !== null ? row.quantity.toString() : "—"}
                    </td>
                    <td className="py-2">
                      {currency(row.price ? Number(row.price) : null)}
                    </td>
                    <td className="py-2">
                      {currency(row.marketValue ? Number(row.marketValue) : null)}
                    </td>
                    <td className="py-2">
                      {percent(row.gainPercent ? Number(row.gainPercent) / 100 : null)}
                    </td>
                    <td className="py-2">
                      {percent(
                        row.percentOfPortfolio
                          ? Number(row.percentOfPortfolio) / 100
                          : null
                      )}
                    </td>
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
