import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}

function sumSigned(
  items: { amount: number; type: "BUY" | "WITHDRAW" }[]
) {
  return items.reduce(
    (acc, item) => acc + (item.type === "WITHDRAW" ? -item.amount : item.amount),
    0
  );
}

export default async function DashboardPage() {
  const latest = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: "desc" },
  });

  if (!latest) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold text-zinc-900">Monthly Update</h1>
        <p className="mt-4 text-zinc-600">
          No monthly snapshot yet. Ask an admin to add the first month-end
          snapshot.
        </p>
      </div>
    );
  }

  const snapshotDate = latest.date;
  const monthStart = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), 1);

  const contributions = await prisma.contribution.findMany({
    where: { date: { lte: snapshotDate } },
    include: { member: true },
    orderBy: { date: "asc" },
  });

  const btcPurchases = await prisma.btcPurchase.findMany({
    where: { date: { lte: snapshotDate } },
    orderBy: { date: "asc" },
  });

  const totalShares = sumSigned(
    contributions.map((c) => ({
      amount: Number(c.shares),
      type: c.type,
    }))
  );

  const sharePrice = totalShares > 0 ? Number(latest.totalValue) / totalShares : 0;

  const btcHoldings = btcPurchases.reduce(
    (acc, purchase) => acc + Number(purchase.btcAmount),
    0
  );
  const btcValue = btcHoldings * Number(latest.btcPrice);

  const memberTotals = new Map<
    string,
    {
      name: string;
      sharesBefore: number;
      sharesAfter: number;
    }
  >();

  for (const contribution of contributions) {
    const key = contribution.memberId;
    const entry = memberTotals.get(key) || {
      name: contribution.member.name,
      sharesBefore: 0,
      sharesAfter: 0,
    };

    const signedShares =
      contribution.type === "WITHDRAW"
        ? -Number(contribution.shares)
        : Number(contribution.shares);

    if (contribution.date < monthStart) {
      entry.sharesBefore += signedShares;
    }
    entry.sharesAfter += signedShares;

    memberTotals.set(key, entry);
  }

  const memberRows = Array.from(memberTotals.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Yacht Club
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">Monthly Update</h1>
        <p className="text-zinc-600">
          Snapshot for {snapshotDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Portfolio Value</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {currency(Number(latest.totalValue))}
          </p>
          <p className="mt-2 text-sm text-zinc-500">Cash: {currency(Number(latest.cashValue))}</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Share Price</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {currency(sharePrice)}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Total Shares Outstanding: {totalShares.toFixed(4)}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">BTC Holdings</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {btcHoldings.toFixed(6)} BTC
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Value: {currency(btcValue)} at {currency(Number(latest.btcPrice))}/BTC
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-zinc-500">Benchmark</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">S&amp;P 500</p>
          <p className="mt-2 text-sm text-zinc-500">{Number(latest.sp500Value).toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Member Ownership</h2>
          <p className="text-sm text-zinc-500">Before vs After this month</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Member</th>
                <th className="py-2">Shares Before</th>
                <th className="py-2">Shares After</th>
                <th className="py-2">Ownership Before</th>
                <th className="py-2">Ownership After</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700">
              {memberRows.map((member) => {
                const beforePct = totalShares > 0 ? member.sharesBefore / totalShares : 0;
                const afterPct = totalShares > 0 ? member.sharesAfter / totalShares : 0;

                return (
                  <tr key={member.name} className="border-t border-zinc-100">
                    <td className="py-2 font-medium text-zinc-900">{member.name}</td>
                    <td className="py-2">{member.sharesBefore.toFixed(4)}</td>
                    <td className="py-2">{member.sharesAfter.toFixed(4)}</td>
                    <td className="py-2">{percent(beforePct)}</td>
                    <td className="py-2">{percent(afterPct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {latest.notes ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Since Last Meeting</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-zinc-600">{latest.notes}</p>
        </section>
      ) : null}
    </div>
  );
}
