import { prisma } from "@/lib/db";
import { MemberShareForm } from "./MemberShareForm";
import { ActionForm } from "../import/ActionForm";
import { addMemberShares, addNewMember, importMemberShares } from "./actions";

export const dynamic = "force-dynamic";

type MemberRow = {
  id: string;
  name: string;
  email: string | null;
  shares: number;
  value: number | null;
  ownership: number | null;
};

function sumSigned(
  items: { shares: number; type: "BUY" | "WITHDRAW" }[]
) {
  return items.reduce(
    (acc, item) => acc + (item.type === "WITHDRAW" ? -item.shares : item.shares),
    0
  );
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

export default async function MembersPage() {
  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: "desc" },
  });

  const members = await prisma.member.findMany({
    include: { contributions: true },
    orderBy: { name: "asc" },
  });

  const memberRows: MemberRow[] = members.map((member) => {
    const shares = sumSigned(
      member.contributions.map((c) => ({
        shares: Number(c.shares),
        type: c.type,
      }))
    );
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      shares,
      value: null,
      ownership: null,
    };
  });

  const totalShares = memberRows.reduce((acc, row) => acc + row.shares, 0);
  const sharePrice =
    latestSnapshot && totalShares > 0
      ? Number(latestSnapshot.totalValue) / totalShares
      : null;
  const hasSnapshot = Boolean(latestSnapshot);

  const enrichedRows = memberRows.map((row) => ({
    ...row,
    value: sharePrice ? row.shares * sharePrice : null,
    ownership: totalShares > 0 ? row.shares / totalShares : null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Members</h1>
        <p className="text-zinc-600">
          Manage ownership, add shares, and onboard new members.
        </p>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-500">Current Share Price</p>
            <p className="text-xl font-semibold text-zinc-900">
              {sharePrice ? formatCurrency(sharePrice) : "—"}
            </p>
          </div>
          <div className="text-sm text-zinc-500">
            Total Shares: {totalShares.toLocaleString("en-US", { maximumFractionDigits: 4 })}
          </div>
        </div>

        <MemberShareForm
          members={enrichedRows}
          sharePrice={sharePrice}
          hasSnapshot={hasSnapshot}
          action={addMemberShares}
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900">Add New Member</h2>
          <p className="text-sm text-zinc-600">
            Add a new member with an opening share balance.
          </p>
          {!hasSnapshot ? (
            <p className="text-xs text-zinc-500">
              Add a monthly snapshot first to enable share price calculations.
            </p>
          ) : null}
        </div>
        <ActionForm action={addNewMember} className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            name="name"
            placeholder="Full name"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email (optional)"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
          />
          <input
            type="number"
            step="0.0001"
            min="0"
            name="shares"
            placeholder="Shares"
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={!hasSnapshot}
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white md:col-span-3 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Add Member
          </button>
        </ActionForm>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900">Bulk Share Updates (CSV)</h2>
          <p className="text-sm text-zinc-600">
            Optional CSV import for share additions. Columns: member_name, member_email,
            shares, date.
          </p>
          {!hasSnapshot ? (
            <p className="text-xs text-zinc-500">
              Add a monthly snapshot first to enable share price calculations.
            </p>
          ) : null}
        </div>
        <ActionForm action={importMemberShares} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <label className="flex flex-col gap-1">
              Default Date
              <input
                type="date"
                name="date"
                className="w-fit rounded-xl border border-zinc-200 px-4 py-2 text-sm"
              />
            </label>
            <input type="file" name="members" accept=".csv" className="text-sm" />
          </div>
          <button
            type="submit"
            disabled={!hasSnapshot}
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Import Member Shares
          </button>
        </ActionForm>
      </section>

      {latestSnapshot ? (
        <p className="text-xs text-zinc-500">
          Share price is based on the latest snapshot ({latestSnapshot.date.toLocaleDateString(
            "en-US"
          )}). Ownership percentages update automatically.
        </p>
      ) : (
        <p className="text-xs text-zinc-500">
          Add a monthly snapshot to enable automatic share price calculations.
        </p>
      )}
    </div>
  );
}
