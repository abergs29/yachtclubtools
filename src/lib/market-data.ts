import { Prisma } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

const TWELVEDATA_ENDPOINT = "https://api.twelvedata.com/price";
const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_MIN_REFRESH_MINUTES = 10;

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

async function getTrackedSymbols() {
  const latestPositions = await prisma.positionSnapshot.findFirst({
    orderBy: { date: "desc" },
  });

  if (latestPositions) {
    const positions = await prisma.positionSnapshot.findMany({
      where: { date: latestPositions.date },
      orderBy: { symbol: "asc" },
    });

    const symbols = positions
      .map((pos) => pos.symbol)
      .filter(Boolean)
      .map(normalizeSymbol)
      .filter((symbol) => !symbol.includes("**") && symbol !== "SPAXX");

    return Array.from(new Set(symbols));
  }

  const livePositions = await prisma.livePosition.findFirst({
    orderBy: { date: "desc" },
  });

  if (livePositions) {
    const positions = await prisma.livePosition.findMany({
      where: { date: livePositions.date },
      orderBy: { symbol: "asc" },
    });

    const symbols = positions
      .map((pos) => pos.symbol)
      .filter(Boolean)
      .map(normalizeSymbol);

    return Array.from(new Set(symbols));
  }

  const trades = await prisma.trade.findMany({
    orderBy: { date: "desc" },
    take: 200,
  });

  const symbols = trades
    .map((trade) => trade.ticker)
    .filter(Boolean)
    .map(normalizeSymbol);

  return Array.from(new Set(symbols));
}

function parsePriceResponse(symbols: string[], data: unknown) {
  const quotes: { symbol: string; price: number }[] = [];

  if (typeof data !== "object" || data === null) {
    return quotes;
  }

  if ("price" in data && typeof (data as { price: string }).price === "string") {
    const price = Number((data as { price: string }).price);
    if (Number.isFinite(price)) {
      quotes.push({ symbol: symbols[0], price });
    }
    return quotes;
  }

  for (const [symbol, payload] of Object.entries(data as Record<string, unknown>)) {
    if (!payload || typeof payload !== "object") continue;
    const priceValue = (payload as { price?: string }).price;
    if (typeof priceValue !== "string") continue;
    const price = Number(priceValue);
    if (Number.isFinite(price)) {
      quotes.push({ symbol, price });
    }
  }

  return quotes;
}

export async function refreshMarketQuotes({
  symbols,
}: {
  symbols?: string[];
} = {}) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY is not set.");
  }

  const trackedSymbols = symbols ?? (await getTrackedSymbols());
  if (trackedSymbols.length === 0) {
    return { count: 0, symbols: [] };
  }

  const minMinutes = Number(process.env.MARKET_QUOTES_MINUTES ?? DEFAULT_MIN_REFRESH_MINUTES);
  const latest = await prisma.marketQuote.findFirst({
    where: { source: "TWELVEDATA" },
    orderBy: { asOf: "desc" },
  });

  if (latest) {
    const elapsedMinutes = (Date.now() - latest.asOf.getTime()) / 60000;
    if (elapsedMinutes < minMinutes) {
      return { count: 0, symbols: trackedSymbols, skipped: true };
    }
  }

  const url = new URL(TWELVEDATA_ENDPOINT);
  url.searchParams.set("symbol", trackedSymbols.join(","));
  url.searchParams.set("apikey", apiKey);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Twelve Data request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data?.status === "error") {
    throw new Error(data?.message || "Twelve Data error");
  }
  const quotes = parsePriceResponse(trackedSymbols, data);
  const asOf = new Date();

  if (quotes.length > 0) {
    await prisma.marketQuote.createMany({
      data: quotes.map((quote) => ({
        symbol: normalizeSymbol(quote.symbol),
        price: new Prisma.Decimal(quote.price),
        asOf,
        source: "TWELVEDATA",
      })),
    });
  }

  const retentionDays = Number(
    process.env.MARKET_QUOTES_RETENTION_DAYS ?? DEFAULT_RETENTION_DAYS
  );
  const cutoff = subDays(new Date(), retentionDays);
  await prisma.marketQuote.deleteMany({
    where: {
      asOf: { lt: cutoff },
    },
  });

  return { count: quotes.length, symbols: trackedSymbols };
}
