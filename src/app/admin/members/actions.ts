"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseCsv, parseNumber } from "@/lib/csv";
import type { ActionResult } from "../import/types";

type ShareContext = {
  sharePrice: number;
  totalShares: number;
};

function actionError(message: string): ActionResult {
  return { ok: false, message };
}

function actionSuccess(message: string): ActionResult {
  return { ok: true, message };
}

function requireString(value: FormDataEntryValue | null, label: string) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Please provide a valid date.");
  }
  return date;
}

function getSignedShares(shares: number, type: "BUY" | "WITHDRAW") {
  return type === "WITHDRAW" ? -shares : shares;
}

async function getTotalShares() {
  const contributions = await prisma.contribution.findMany({
    select: { shares: true, type: true },
  });
  return contributions.reduce((acc, contribution) => {
    const shares = Number(contribution.shares);
    return acc + getSignedShares(shares, contribution.type);
  }, 0);
}

async function getShareContext(netSharesToAdd: number): Promise<ShareContext> {
  const latestSnapshot = await prisma.portfolioSnapshot.findFirst({
    orderBy: { date: "desc" },
  });
  if (!latestSnapshot) {
    throw new Error("Add a monthly snapshot first to set the share price.");
  }

  const totalShares = await getTotalShares();
  if (totalShares <= 0 && netSharesToAdd <= 0) {
    throw new Error("Add at least one share to establish the share price.");
  }

  const denominator = totalShares > 0 ? totalShares : netSharesToAdd;
  const sharePrice = Number(latestSnapshot.totalValue) / denominator;
  if (!Number.isFinite(sharePrice) || sharePrice <= 0) {
    throw new Error("Share price could not be calculated. Check snapshot values.");
  }

  return { sharePrice, totalShares };
}

function parseShares(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const shares = parseNumber(value);
  return shares && shares > 0 ? shares : null;
}

export async function addMemberShares(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const date = parseDate(requireString(formData.get("date"), "Date"));

    const entries: { memberId: string; shares: number }[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("shares_")) continue;
      const memberId = key.replace("shares_", "");
      const shares = parseShares(value);
      if (!shares) continue;
      entries.push({ memberId, shares });
    }

    if (entries.length === 0) {
      return actionError("Enter shares for at least one member.");
    }

    const netShares = entries.reduce((acc, entry) => acc + entry.shares, 0);
    const { sharePrice } = await getShareContext(netShares);

    await prisma.$transaction(
      entries.map((entry) =>
        prisma.contribution.create({
          data: {
            memberId: entry.memberId,
            date,
            shares: entry.shares,
            amount: entry.shares * sharePrice,
            type: "BUY",
            memo: "Admin share adjustment",
          },
        })
      )
    );

    revalidatePath("/dashboard");
    revalidatePath("/admin/members");

    return actionSuccess(
      `Added ${netShares.toFixed(4)} shares across ${entries.length} member(s).`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return actionError(message);
  }
}

export async function addNewMember(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const name = requireString(formData.get("name"), "Name");
    const emailRaw = formData.get("email");
    const email =
      typeof emailRaw === "string" && emailRaw.trim() ? emailRaw.trim() : null;
    const shares = parseShares(formData.get("shares"));
    if (!shares) {
      return actionError("Shares must be a positive number.");
    }

    const { sharePrice } = await getShareContext(shares);

    const member = await prisma.member.create({
      data: {
        name,
        email,
      },
    });

    await prisma.contribution.create({
      data: {
        memberId: member.id,
        date: new Date(),
        shares,
        amount: shares * sharePrice,
        type: "BUY",
        memo: "New member shares",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin/members");

    return actionSuccess(`Added ${name} with ${shares.toFixed(4)} shares.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return actionError(message);
  }
}

type MemberLookup = {
  name?: string;
  email?: string;
};

async function findOrCreateMember({ name, email }: MemberLookup) {
  if (email) {
    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) return existing;
  }
  if (name) {
    const existing = await prisma.member.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) return existing;
  }
  if (!name) {
    throw new Error("Each row must include a member name or email.");
  }
  return prisma.member.create({ data: { name, email: email || null } });
}

export async function importMemberShares(
  _prevState: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const file = formData.get("members");
    if (!file || typeof file !== "object" || typeof (file as Blob).text !== "function") {
      return actionError("Please choose a CSV file before importing.");
    }
    const csv = await (file as Blob).text();
    const rows = parseCsv(csv);
    if (rows.length === 0) return actionError("The CSV file is empty.");

    const netShares = rows.reduce((acc, row) => {
      const shares =
        parseNumber(row.shares ?? row.total_shares ?? row.totalShares ?? row["shares"]) ??
        null;
      return shares && shares > 0 ? acc + shares : acc;
    }, 0);

    if (netShares <= 0) {
      return actionError("No valid share amounts found in the file.");
    }

    const { sharePrice } = await getShareContext(netShares);
    const fallbackDateRaw = formData.get("date");
    const fallbackDate =
      typeof fallbackDateRaw === "string" && fallbackDateRaw
        ? parseDate(fallbackDateRaw)
        : new Date();

    let created = 0;
    for (const row of rows) {
      const name =
        row.member_name ||
        row.name ||
        row.member ||
        row.membername ||
        row["member name"];
      const email =
        row.member_email ||
        row.email ||
        row.memberemail ||
        row["member email"];
      const shares = parseNumber(row.shares ?? row.total_shares ?? row.totalShares ?? "");

      if (!shares || shares <= 0) continue;

      const date = row.date ? parseDate(row.date) : fallbackDate;
      const member = await findOrCreateMember({
        name: typeof name === "string" ? name.trim() : undefined,
        email: typeof email === "string" ? email.trim() : undefined,
      });

      await prisma.contribution.create({
        data: {
          memberId: member.id,
          date,
          shares,
          amount: shares * sharePrice,
          type: "BUY",
          memo: "Member share import",
        },
      });
      created += 1;
    }

    if (created === 0) {
      return actionError("No valid rows found in the file.");
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/members");

    return actionSuccess(`Imported ${created} member share rows.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return actionError(message);
  }
}
