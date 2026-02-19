import { prisma } from "@/lib/db";
import { LivePositionsTable } from "./LivePositionsTable";

export const dynamic = "force-dynamic";

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
  const latestQuote = await prisma.marketQuote.findFirst({
    orderBy: { asOf: "desc" },
  });

  const positionRows = latestPosition
    ? await prisma.positionSnapshot.findMany({
        where: { date: latestPosition.date },
        orderBy: { currentValue: "desc" },
      })
    : [];

  const quoteRows = latestQuote
    ? await prisma.marketQuote.findMany({
        where: { asOf: latestQuote.asOf },
        orderBy: { symbol: "asc" },
      })
    : [];

  const symbols = positionRows
    .map((row) => row.symbol?.trim())
    .filter(Boolean)
    .map((symbol) => symbol!.toUpperCase());

  const latestQuotes = symbols.length
    ? await prisma.marketQuote.findMany({
        where: { symbol: { in: symbols } },
        orderBy: { asOf: "desc" },
      })
    : [];

  const quoteMap = new Map<
    string,
    { price: number; asOf: Date }
  >();
  let latestAsOf: Date | null = null;
  for (const quote of latestQuotes) {
    const symbol = quote.symbol.toUpperCase();
    if (!quoteMap.has(symbol)) {
      const price = Number(quote.price);
      quoteMap.set(symbol, { price, asOf: quote.asOf });
    }
    if (!latestAsOf || quote.asOf > latestAsOf) {
      latestAsOf = quote.asOf;
    }
  }

  const liveRows = positionRows.map((row) => {
    const symbol = row.symbol.trim().toUpperCase();
    const quantity = row.quantity !== null ? Number(row.quantity) : null;
    const price = quoteMap.get(symbol)?.price ?? null;
    const marketValue =
      quantity !== null && price !== null ? quantity * price : null;
    const costBasisTotal =
      row.costBasisTotal !== null
        ? Number(row.costBasisTotal)
        : row.averageCostBasis !== null && quantity !== null
          ? Number(row.averageCostBasis) * quantity
          : null;
    const gainDollar =
      marketValue !== null && costBasisTotal !== null
        ? marketValue - costBasisTotal
        : null;
    const gainPercent =
      gainDollar !== null && costBasisTotal
        ? gainDollar / costBasisTotal
        : null;

    return {
      id: row.id,
      symbol,
      quantity,
      asset: row.assetType ?? null,
      price,
      cost: costBasisTotal,
      marketValue,
      gainDollar,
      gainPercent,
      percentPortfolio: null,
      term: null,
      beta: null,
      pe: null,
      weekHigh: null,
      weekLow: null,
      gain30: null,
      gain60: null,
      gain90: null,
      weight: null,
      estPurchase: null,
      sharesTarget: null,
      rounded: null,
      totalPurchase: null,
    };
  });

  const totalMarketValue = liveRows.reduce(
    (acc, row) => acc + (row.marketValue ?? 0),
    0
  );
  const liveRowsWithPct = liveRows.map((row) => ({
    ...row,
    percentPortfolio:
      totalMarketValue > 0 && row.marketValue !== null
        ? row.marketValue / totalMarketValue
        : null,
  }));

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

      <LivePositionsTable
        rows={liveRowsWithPct}
        asOfLabel={latestAsOf ? latestAsOf.toLocaleString("en-US") : null}
      />

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
          <h2 className="text-xl font-semibold text-zinc-900">Market Quotes (Twelve Data)</h2>
          {latestQuote ? (
            <p className="text-sm text-zinc-500">
              As of {latestQuote.asOf.toLocaleString("en-US")}
            </p>
          ) : null}
        </div>
        {quoteRows.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No market quotes yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr>
                  <th className="py-2">Symbol</th>
                  <th className="py-2">Price</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700">
                {quoteRows.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-100">
                    <td className="py-2 font-medium text-zinc-900">{row.symbol}</td>
                    <td className="py-2">{currency(Number(row.price))}</td>
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
