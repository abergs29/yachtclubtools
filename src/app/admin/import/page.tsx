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

const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm space-y-4";

export default function ImportPage() {
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
        <form
          action={importContributions}
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <input
            type="file"
            name="contributions"
            accept=".csv"
            className="text-sm"
            required
          />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Contributions
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">BTC Purchase (Manual)</h2>
          <p className="text-sm text-zinc-600">
            Enter a single BTC purchase (typical monthly flow).
          </p>
        </div>
        <form action={createBtcPurchase} className="grid gap-4 md:grid-cols-2">
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
        </form>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">BTC Purchases CSV</h2>
          <p className="text-sm text-zinc-600">
            CSV headers: <span className="font-mono">Purchase Date, Amount Purchased (BTC), Amount Purchased (USD), Purchased At (BTC/USD)</span>.
          </p>
        </div>
        <form
          action={importBtcPurchases}
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <input type="file" name="btc" accept=".csv" className="text-sm" required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import BTC Purchases
          </button>
        </form>
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
        <form action={refreshQuotes} className="flex flex-col gap-4">
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Refresh Quotes Now
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Fidelity Positions Snapshot</h2>
          <p className="text-sm text-zinc-600">
            Upload the positions export (portfolio snapshot). Optionally set an as‑of date if the filename does not include one.
          </p>
        </div>
        <form
          action={importFidelityPositions}
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <input type="date" name="positionsDate" className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm" />
          <input type="file" name="positions" accept=".csv" className="text-sm" required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Positions Snapshot
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Fidelity Trade History</h2>
          <p className="text-sm text-zinc-600">
            Upload the activity/history export. Buys and sells will be added to the trade ledger.
          </p>
        </div>
        <form
          action={importFidelityHistory}
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <input type="file" name="history" accept=".csv" className="text-sm" required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Trade History
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Live Prices (GoogleFinance Sheet)</h2>
          <p className="text-sm text-zinc-600">
            Upload the live prices CSV. The importer looks for the row with the Symbol header.
          </p>
        </div>
        <form
          action={importLivePrices}
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <input type="date" name="livePricesDate" className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm" />
          <input type="file" name="livePrices" accept=".csv" className="text-sm" required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Live Prices
          </button>
        </form>
      </section>

      <section className={sectionClass}>
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Trades (Generic CSV)</h2>
          <p className="text-sm text-zinc-600">
            If you use a non‑Fidelity export, map to: Date, Symbol, Action, Quantity, Price.
          </p>
        </div>
        <form
          action={importTrades}
          encType="multipart/form-data"
          className="flex flex-col gap-4"
        >
          <input type="file" name="trades" accept=".csv" className="text-sm" required />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Trades CSV
          </button>
        </form>
      </section>
    </div>
  );
}
