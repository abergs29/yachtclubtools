import {
  createBtcPurchase,
  importBtcPurchases,
  importContributions,
  importFidelityHistory,
  importFidelityPositions,
  importLivePrices,
  importTrades,
  refreshQuotes,
} from "./actions";
import { ActionForm } from "./ActionForm";
import { prisma } from "@/lib/db";

const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm space-y-4";

const fileInputClass =
  "text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800 cursor-pointer";

function currency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function ImportPage() {
  const recentTrades = await prisma.trade.findMany({
    orderBy: { date: "desc" },
    take: 25,
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Imports & Updates</h1>
        <p className="text-zinc-600">
          Upload Fidelity exports or enter BTC purchases manually to keep the
          monthly update accurate.
        </p>
      </div>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Contributions Import
          </h2>
          <p className="text-sm text-zinc-600">
            CSV headers: <span className="font-mono">date,member_name,amount,shares,type,memo</span>
            . You can also use <span className="font-mono">member_id</span> or <span className="font-mono">member_email</span>.
          </p>
        </div>
        <ActionForm action={importContributions} className="flex flex-col gap-4">
          <input
            type="file"
            name="contributions"
            accept=".csv"
            className={fileInputClass}
            required
          />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Contributions
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">BTC Purchase (Manual)</h2>
          <p className="text-sm text-zinc-600">
            Enter a single BTC purchase (typical monthly flow).
          </p>
        </div>
        <ActionForm action={createBtcPurchase} className="grid gap-4 md:grid-cols-2">
          <input type="date" name="date" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm" required />
          <input type="text" name="btcAmount" placeholder="BTC amount" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm" required />
          <input type="text" name="usdAmount" placeholder="USD amount" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm" required />
          <input type="text" name="btcPrice" placeholder="BTC price" className="rounded-xl border border-zinc-200 px-4 py-2 text-sm" required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Save BTC Purchase
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">BTC Purchases CSV</h2>
          <p className="text-sm text-zinc-600">
            CSV headers: <span className="font-mono">Purchase Date, Amount Purchased (BTC), Amount Purchased (USD), Purchased At (BTC/USD)</span>.
          </p>
        </div>
        <ActionForm action={importBtcPurchases} className="flex flex-col gap-4">
          <input type="file" name="btc" accept=".csv" className={fileInputClass} required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import BTC Purchases
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Market Quotes (Twelve Data)
          </h2>
          <p className="text-sm text-zinc-600">
            Pull current prices for the latest holdings. The refresh is rate‑limited
            to avoid exceeding daily API limits.
          </p>
        </div>
        <ActionForm action={refreshQuotes} className="flex flex-col gap-4">
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Refresh Quotes Now
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Fidelity Positions Snapshot</h2>
          <p className="text-sm text-zinc-600">
            Upload the positions export (portfolio snapshot). Optionally set an as‑of date if the filename does not include one.
          </p>
        </div>
        <ActionForm action={importFidelityPositions} className="flex flex-col gap-4">
          <input type="date" name="positionsDate" className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm" />
          <input type="file" name="positions" accept=".csv" className={fileInputClass} required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Positions Snapshot
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Fidelity Trade History</h2>
          <p className="text-sm text-zinc-600">
            Upload the activity/history export. Buys and sells will be added to the trade ledger.
          </p>
        </div>
        <ActionForm action={importFidelityHistory} className="flex flex-col gap-4">
          <input type="file" name="history" accept=".csv" className={fileInputClass} required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Trade History
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Live Prices (GoogleFinance Sheet)</h2>
          <p className="text-sm text-zinc-600">
            Upload the live prices CSV. The importer looks for the row with the Symbol header.
          </p>
        </div>
        <ActionForm action={importLivePrices} className="flex flex-col gap-4">
          <input type="date" name="livePricesDate" className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm" />
          <input type="file" name="livePrices" accept=".csv" className={fileInputClass} required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Live Prices
          </button>
        </ActionForm>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Trades (Generic CSV)</h2>
          <p className="text-sm text-zinc-600">
            If you use a non‑Fidelity export, map to: Date, Symbol, Action, Quantity, Price.
          </p>
        </div>
        <ActionForm action={importTrades} className="flex flex-col gap-4">
          <input type="file" name="trades" accept=".csv" className={fileInputClass} required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Trades CSV
          </button>
        </ActionForm>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Recent Trades</h2>
          <p className="text-sm text-zinc-500">
            Latest 25 rows from Fidelity history / trades import
          </p>
        </div>
        {recentTrades.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No trades imported yet.
          </p>
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
