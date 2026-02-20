import { prisma } from "@/lib/db";
import { createSnapshot } from "./actions";
import {
  createBtcPurchase,
  importBtcPurchases,
  importContributions,
  importFidelityHistory,
  importFidelityPositions,
  refreshQuotes,
} from "../import/actions";
import { ActionForm } from "../import/ActionForm";

export const dynamic = "force-dynamic";

const sectionClass =
  "rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm space-y-4";

const fileInputClass =
  "text-sm file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800 cursor-pointer";

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatCstTimestamp(date: Date) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return (
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      }).format(date) + " CT"
    );
  }
}

export default async function MonthlyUpdatePage() {
  const latest = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: "desc" },
  });
  const latestQuote = await prisma.marketQuote.findFirst({
    orderBy: { asOf: "desc" },
  });
  const latestQuoteLabel = latestQuote ? formatCstTimestamp(latestQuote.asOf) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
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

      <div className="space-y-2 pt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Imports
        </p>
        <h2 className="text-2xl font-semibold text-zinc-900">Imports & Updates</h2>
        <p className="text-zinc-600">
          Upload Fidelity exports or enter BTC purchases manually to keep the
          monthly update accurate.
        </p>
      </div>

      <section className={sectionClass}>
        <div>
          <h3 className="text-xl font-semibold text-zinc-900">
            Contributions Import
          </h3>
          <p className="text-sm text-zinc-600">
            CSV headers:{" "}
            <span className="font-mono">
              date,member_name,amount,shares,type,memo
            </span>
            . You can also use <span className="font-mono">member_id</span> or{" "}
            <span className="font-mono">member_email</span>.
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
          <h3 className="text-xl font-semibold text-zinc-900">
            BTC Purchase (Manual)
          </h3>
          <p className="text-sm text-zinc-600">
            Enter a single BTC purchase (typical monthly flow).
          </p>
        </div>
        <ActionForm action={createBtcPurchase} className="grid gap-4 md:grid-cols-2">
          <input
            type="date"
            name="date"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
          <input
            type="text"
            name="btcAmount"
            placeholder="BTC amount"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
          <input
            type="text"
            name="usdAmount"
            placeholder="USD amount"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
          <input
            type="text"
            name="btcPrice"
            placeholder="BTC price"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
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
          <h3 className="text-xl font-semibold text-zinc-900">
            BTC Purchases CSV
          </h3>
          <p className="text-sm text-zinc-600">
            CSV headers:{" "}
            <span className="font-mono">
              Purchase Date, Amount Purchased (BTC), Amount Purchased (USD),
              Purchased At (BTC/USD)
            </span>
            .
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
          <h3 className="text-xl font-semibold text-zinc-900">
            Market Quotes (Twelve Data)
          </h3>
          <p className="text-sm text-zinc-600">
            Pull current prices for the latest holdings. The refresh is rate-limited
            to avoid exceeding daily API limits.
          </p>
          <p className="text-xs text-zinc-500">
            {latestQuoteLabel
              ? `Last refreshed ${latestQuoteLabel}.`
              : "No quotes refreshed yet."}
          </p>
          <p className="text-xs text-zinc-500">
            Auto-refresh runs only if a scheduler hits /api/market-quotes/refresh.
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
          <h3 className="text-xl font-semibold text-zinc-900">
            Fidelity Positions Snapshot
          </h3>
          <p className="text-sm text-zinc-600">
            Upload the positions export (portfolio snapshot). Optionally set an as-of
            date if the filename does not include one.
          </p>
        </div>
        <ActionForm action={importFidelityPositions} className="flex flex-col gap-4">
          <input
            type="date"
            name="positionsDate"
            className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm"
          />
          <input
            type="file"
            name="positions"
            accept=".csv"
            className={fileInputClass}
            required
          />
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
          <h3 className="text-xl font-semibold text-zinc-900">
            Fidelity Trade History
          </h3>
          <p className="text-sm text-zinc-600">
            Upload the activity/history export. Buys and sells will be added to the
            trade ledger.
          </p>
        </div>
        <ActionForm action={importFidelityHistory} className="flex flex-col gap-4">
          <input
            type="file"
            name="history"
            accept=".csv"
            className={fileInputClass}
            required
          />
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Import Trade History
          </button>
        </ActionForm>
      </section>

    </div>
  );
}
