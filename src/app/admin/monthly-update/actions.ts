"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function requireString(value: FormDataEntryValue | null, label: string) {
  if (!value || typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function toNumber(value: FormDataEntryValue | null, label: string) {
  const raw = requireString(value, label);
  const cleaned = raw.replace(/\$/g, "").replace(/,/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a number`);
  }
  return num;
}

export async function createSnapshot(formData: FormData) {
  const date = new Date(requireString(formData.get("date"), "Date"));
  const totalValue = toNumber(formData.get("totalValue"), "Total value");
  const cashValue = toNumber(formData.get("cashValue"), "Cash value");
  const btcPrice = toNumber(formData.get("btcPrice"), "BTC price");
  const sp500Value = toNumber(formData.get("sp500Value"), "S&P 500 value");
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  await prisma.portfolioSnapshot.upsert({
    where: { date },
    update: {
      totalValue,
      cashValue,
      btcPrice,
      sp500Value,
      notes,
    },
    create: {
      date,
      totalValue,
      cashValue,
      btcPrice,
      sp500Value,
      notes,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/monthly-update");
  redirect("/dashboard");
}
