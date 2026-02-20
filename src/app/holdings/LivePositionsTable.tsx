"use client";

import { useMemo, useState } from "react";

type LiveRow = {
  id: string;
  symbol: string;
  quantity: number | null;
  asset: string | null;
  price: number | null;
  cost: number | null;
  marketValue: number | null;
  gainDollar: number | null;
  gainPercent: number | null;
  percentPortfolio: number | null;
  term: string | null;
  beta: number | null;
  pe: number | null;
  weekHigh: number | null;
  weekLow: number | null;
  gain30: number | null;
  gain60: number | null;
  gain90: number | null;
  weight: number | null;
  estPurchase: number | null;
  sharesTarget: number | null;
  rounded: number | null;
  totalPurchase: number | null;
};

type Column = {
  key: keyof LiveRow;
  label: string;
  default: boolean;
};

const columns: Column[] = [
  { key: "symbol", label: "Symbol", default: true },
  { key: "quantity", label: "Qty", default: true },
  { key: "asset", label: "Asset", default: true },
  { key: "price", label: "Price", default: true },
  { key: "cost", label: "Cost", default: true },
  { key: "marketValue", label: "Mkt value", default: true },
  { key: "gainDollar", label: "Gain ($)", default: true },
  { key: "gainPercent", label: "Gain (%)", default: true },
  { key: "percentPortfolio", label: "% of Portfolio", default: true },
  { key: "term", label: "Term", default: false },
  { key: "beta", label: "Beta", default: false },
  { key: "pe", label: "P/E", default: false },
  { key: "weekHigh", label: "52 Wk High", default: false },
  { key: "weekLow", label: "52 Wk Low", default: false },
  { key: "gain30", label: "30 Day Gain", default: false },
  { key: "gain60", label: "60 Day Gain", default: false },
  { key: "gain90", label: "90 Day Gain", default: false },
  { key: "weight", label: "Weight", default: false },
  { key: "estPurchase", label: "Est. Purchase", default: false },
  { key: "sharesTarget", label: "# Shares", default: false },
  { key: "rounded", label: "Rounded", default: false },
  { key: "totalPurchase", label: "Total Purchase", default: false },
];

const defaultKeys = new Set(columns.filter((col) => col.default).map((col) => col.key));

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) return "--";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
}

function formatCell(key: keyof LiveRow, value: LiveRow[keyof LiveRow]) {
  if (value === null || value === undefined) return "--";
  if (key === "symbol" || key === "asset" || key === "term") return String(value);
  if (key === "price" || key === "cost" || key === "marketValue" || key === "gainDollar" || key === "estPurchase" || key === "totalPurchase") {
    return formatCurrency(Number(value));
  }
  if (key === "gainPercent" || key === "percentPortfolio") {
    return formatPercent(Number(value));
  }
  if (key === "quantity" || key === "sharesTarget" || key === "rounded") {
    return formatNumber(Number(value), 4);
  }
  if (key === "beta" || key === "pe" || key === "weekHigh" || key === "weekLow" || key === "gain30" || key === "gain60" || key === "gain90" || key === "weight") {
    return formatNumber(Number(value), 2);
  }
  return String(value);
}

export function LivePositionsTable({
  rows,
  asOfLabel,
}: {
  rows: LiveRow[];
  asOfLabel: string | null;
}) {
  const [optionalKeys, setOptionalKeys] = useState<Set<keyof LiveRow>>(() => new Set());

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => col.default || optionalKeys.has(col.key));
  }, [optionalKeys]);

  const optionalColumns = useMemo(
    () => columns.filter((col) => !col.default),
    []
  );

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Live Prices</h2>
          <p className="text-sm text-zinc-500">
            Twelve Data prices mapped to the latest Fidelity positions snapshot. Auto refreshes every 10 minutes.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          {asOfLabel ? `As of ${asOfLabel}` : "Quotes not refreshed yet"}
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
          Add optional metrics
        </summary>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {optionalColumns.map((col) => {
            const checked = optionalKeys.has(col.key);
            return (
              <label key={col.key} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checked}
                  onChange={() => {
                    setOptionalKeys((prev) => {
                      const next = new Set(prev);
                      if (next.has(col.key)) {
                        next.delete(col.key);
                      } else {
                        next.add(col.key);
                      }
                      return next;
                    });
                  }}
                />
                {col.label}
              </label>
            );
          })}
        </div>
      </details>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No positions imported yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.key} className="py-2">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-100">
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="py-2">
                      {formatCell(col.key, row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
