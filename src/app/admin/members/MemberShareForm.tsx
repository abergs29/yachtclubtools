"use client";

import { useMemo, useState } from "react";
import { ActionForm } from "../import/ActionForm";
import type { ActionResult } from "../import/types";

type ActionFn = (
  prevState: ActionResult | undefined,
  formData: FormData
) => Promise<ActionResult>;

type MemberRow = {
  id: string;
  name: string;
  email: string | null;
  shares: number;
  value: number | null;
  ownership: number | null;
};

function formatNumber(value: number | null, digits = 4) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}

export function MemberShareForm({
  members,
  sharePrice,
  hasSnapshot,
  action,
}: {
  members: MemberRow[];
  sharePrice: number | null;
  hasSnapshot: boolean;
  action: ActionFn;
}) {
  const [shareInputs, setShareInputs] = useState<Record<string, string>>({});

  const netShares = useMemo(() => {
    return Object.values(shareInputs).reduce((acc, value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return acc;
      return acc + parsed;
    }, 0);
  }, [shareInputs]);

  const disabled = !hasSnapshot || members.length === 0;

  return (
    <ActionForm action={action} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Member Ledger</h2>
          <p className="text-sm text-zinc-600">
            Add shares to members for a specific date. Ownership and values are
            auto-calculated.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Effective Date
          <input
            type="date"
            name="date"
            className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
        </label>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-zinc-500">No members yet. Add your first member below.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Member</th>
                <th className="py-2">Total Shares</th>
                <th className="py-2">Value</th>
                <th className="py-2">Ownership</th>
                <th className="py-2">Add Shares</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              {members.map((member) => (
                <tr key={member.id} className="border-t border-zinc-100">
                  <td className="py-2 font-medium text-zinc-900">
                    {member.name}
                    {member.email ? (
                      <div className="text-xs text-zinc-500">{member.email}</div>
                    ) : null}
                  </td>
                  <td className="py-2">{formatNumber(member.shares, 4)}</td>
                  <td className="py-2">{formatCurrency(member.value)}</td>
                  <td className="py-2">{formatPercent(member.ownership)}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      name={`shares_${member.id}`}
                      placeholder="0.0000"
                      value={shareInputs[member.id] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setShareInputs((prev) => ({ ...prev, [member.id]: value }));
                      }}
                      className="w-28 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Net shares added: <span className="font-semibold">{formatNumber(netShares, 4)}</span>
        </p>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          Add shares
        </button>
      </div>
    </ActionForm>
  );
}
