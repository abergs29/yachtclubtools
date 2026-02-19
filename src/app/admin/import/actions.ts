"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { normalizeHeader, parseCsv, parseNumber } from "@/lib/csv";
import { parse as parseRaw } from "csv-parse/sync";
import { refreshMarketQuotes } from "@/lib/market-data";

type UploadBlob = Blob & { name?: string };

function requireFile(formData: FormData, key: string): UploadBlob {
  const file = formData.get(key);
  if (!file || typeof file !== "object") {
    throw new Error("Upload a CSV file.");
  }
  const blob = file as UploadBlob;
  if (typeof blob.text !== "function" || typeof blob.arrayBuffer !== "function") {
    throw new Error("Upload a CSV file.");
  }
  if (typeof blob.size === "number" && blob.size === 0) {
    throw new Error("Upload a CSV file.");
  }
  return blob;
}

function getFileName(file: UploadBlob) {
  return typeof file.name === "string" ? file.name : "";
}

async function readFileText(file: UploadBlob) {
  const text = await file.text();
  if (text && !text.includes("\u0000")) return text;
  const buffer = await file.arrayBuffer();
  // Fidelity exports sometimes come through as UTF-16 with null bytes.
  const decoded = new TextDecoder("utf-16le").decode(buffer);
  return decoded.replace(/\u0000/g, "");
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateFromFilename(name: string) {
  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const monthMatch = name.match(/([A-Za-z]{3})-(\d{1,2})-(\d{4})/);
  if (monthMatch) {
    const [, mon, day, year] = monthMatch;
    const month = monthMap[mon.toLowerCase()];
    if (month !== undefined) {
      return new Date(Number(year), month, Number(day));
    }
  }

  const isoMatch = name.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const usMatch = name.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
}

async function findOrCreateMember({
  id,
  name,
  email,
}: {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}) {
  if (id) {
    const member = await prisma.member.findUnique({ where: { id } });
    if (member) return member;
  }

  if (email) {
    const member = await prisma.member.findUnique({ where: { email } });
    if (member) return member;
  }

  if (name) {
    const member = await prisma.member.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (member) return member;
    return prisma.member.create({ data: { name, email } });
  }

  throw new Error("Each contribution must include member_id, member_name, or member_email.");
}

export async function importContributions(formData: FormData) {
  const file = requireFile(formData, "contributions");
  const text = await readFileText(file);
  const rows = parseCsv(text);

  for (const row of rows) {
    const date = parseDate(row.date);
    const amount = parseNumber(row.amount);
    const shares = parseNumber(row.shares);
    const typeRaw = row.type?.toUpperCase();

    if (!date || amount === null || shares === null) {
      continue;
    }

    const member = await findOrCreateMember({
      id: row.member_id,
      name: row.member_name,
      email: row.member_email,
    });

    await prisma.contribution.create({
      data: {
        memberId: member.id,
        date,
        amount,
        shares,
        type: typeRaw === "WITHDRAW" ? "WITHDRAW" : "BUY",
        memo: row.memo || null,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/import");
}

export async function createBtcPurchase(formData: FormData) {
  const date = parseDate(formData.get("date")?.toString());
  const btcAmount = parseNumber(formData.get("btcAmount")?.toString());
  const usdAmount = parseNumber(formData.get("usdAmount")?.toString());
  const btcPrice = parseNumber(formData.get("btcPrice")?.toString());

  if (!date || btcAmount === null || usdAmount === null || btcPrice === null) {
    throw new Error("All BTC fields are required.");
  }

  await prisma.btcPurchase.create({
    data: {
      date,
      btcAmount,
      usdAmount,
      btcPrice,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/import");
}

export async function importBtcPurchases(formData: FormData) {
  const file = requireFile(formData, "btc");
  const text = await readFileText(file);
  const rows = parseCsv(text);

  const headerMap: Record<string, string> = {};
  if (rows[0]) {
    const headers = Object.keys(rows[0]);
    const normalized = headers.map(normalizeHeader);
    function pick(target: string, options: string[]) {
      const index = normalized.findIndex((header) => options.includes(header));
      if (index >= 0) headerMap[target] = headers[index];
    }

    pick("date", ["date", "purchase date"]);
    pick("btc_amount", ["btc_amount", "amount purchased (btc)"]);
    pick("usd_amount", ["usd_amount", "amount purchased (usd)"]);
    pick("btc_price", ["btc_price", "purchased at (btc/usd)"]);
  }

  for (const row of rows) {
    const date = parseDate(row[headerMap.date || "date"] || row.date);
    const btcAmount = parseNumber(row[headerMap.btc_amount || "btc_amount"] || row.btc_amount);
    const usdAmount = parseNumber(row[headerMap.usd_amount || "usd_amount"] || row.usd_amount);
    const btcPrice = parseNumber(row[headerMap.btc_price || "btc_price"] || row.btc_price);

    if (!date || btcAmount === null || usdAmount === null || btcPrice === null) {
      continue;
    }

    await prisma.btcPurchase.create({
      data: {
        date,
        btcAmount,
        usdAmount,
        btcPrice,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/import");
}

function getHeaderMap(headers: string[]) {
  const normalized = headers.map(normalizeHeader);
  const map: Record<string, string> = {};

  function pick(target: string, options: string[]) {
    const index = normalized.findIndex((header) => options.includes(header));
    if (index >= 0) map[target] = headers[index];
  }

  pick("date", ["date", "trade date", "transaction date", "activity date", "run date"]);
  pick("ticker", ["symbol", "ticker"]);
  pick("action", ["action", "type", "transaction type"]);
  pick("shares", ["quantity", "shares", "qty"]);
  pick("price", ["price", "price per share", "price ($)"]);
  pick("fees", ["fees", "commission", "commissions", "fees and commissions", "fees ($)"]);
  pick("asset_type", ["asset type", "asset class", "security type", "type"]);

  return map;
}

function parseAction(value: string | undefined) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("bought") || normalized.includes("buy")) return "BUY";
  if (normalized.includes("sold") || normalized.includes("sell")) return "SELL";
  return null;
}

function inferAssetType(value: string | undefined, symbol?: string) {
  const normalized = value?.toLowerCase() || "";
  if (normalized.includes("etf")) return "ETF";
  if (normalized.includes("crypto") || normalized.includes("btc")) return "CRYPTO";
  if (normalized.includes("cash") && symbol && symbol.includes("SPAXX")) return "CASH";
  return "STOCK";
}

export async function importTrades(formData: FormData) {
  const file = requireFile(formData, "trades");
  const text = await readFileText(file);
  const rows = parseCsv(text);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const map = getHeaderMap(headers);

  if (!map.date || !map.ticker || !map.action || !map.shares || !map.price) {
    throw new Error(
      "Could not map required columns. Ensure the CSV includes Date, Symbol, Action, Quantity, and Price columns."
    );
  }

  for (const row of rows) {
    const date = parseDate(row[map.date]);
    const action = parseAction(row[map.action]);
    const shares = parseNumber(row[map.shares]);
    const price = parseNumber(row[map.price]);

    if (!date || !action || shares === null || price === null) {
      continue;
    }

    await prisma.trade.create({
      data: {
        date,
        ticker: row[map.ticker],
        action,
        shares,
        price,
        fees: parseNumber(map.fees ? row[map.fees] : undefined) || 0,
        assetType: inferAssetType(map.asset_type ? row[map.asset_type] : undefined, row[map.ticker]),
        notes: null,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/import");
}

export async function importFidelityPositions(formData: FormData) {
  const file = requireFile(formData, "positions");
  const text = await readFileText(file);
  const rawRows: string[][] = parseRaw(text, {
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  });
  if (rawRows.length === 0) return;

  const asOfDateInput = formData.get("positionsDate")?.toString();
  const asOfDate =
    parseDate(asOfDateInput) || parseDateFromFilename(getFileName(file)) || new Date();

  const headerIndex = rawRows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);
    const hasSymbol = normalized.some(
      (cell) => cell === "symbol" || cell.includes("symbol")
    );
    if (!hasSymbol) return false;
    const hints = ["quantity", "last price", "current value", "market value", "description"];
    return normalized.some((cell) => hints.some((hint) => cell.includes(hint)));
  });

  if (headerIndex < 0) {
    throw new Error("Positions import missing a Symbol header row.");
  }

  const headers = rawRows[headerIndex].map((cell) => normalizeHeader(cell));
  const dataRows = rawRows.slice(headerIndex + 1);

  function pickIndex(options: string[]) {
    const index = headers.findIndex((header) =>
      options.some((option) => header === option || header.includes(option))
    );
    return index >= 0 ? index : null;
  }

  const accountNumberIndex = pickIndex(["account number"]);
  const accountNameIndex = pickIndex(["account name"]);
  const symbolIndex = pickIndex(["symbol"]);
  const descriptionIndex = pickIndex(["description"]);
  const quantityIndex = pickIndex(["quantity", "qty", "shares"]);
  const lastPriceIndex = pickIndex(["last price", "price"]);
  const currentValueIndex = pickIndex(["current value", "market value", "mkt value"]);
  const totalGainLossIndex = pickIndex(["total gain/loss dollar", "total gain/loss ($)"]);
  const totalGainLossPercentIndex = pickIndex([
    "total gain/loss percent",
    "total gain/loss (%)",
  ]);
  const percentOfAccountIndex = pickIndex([
    "percent of account",
    "% of account",
    "% of portfolio",
  ]);
  const costBasisIndex = pickIndex(["cost basis total", "cost basis"]);
  const avgCostIndex = pickIndex(["average cost basis", "avg cost basis", "average cost"]);
  const typeIndex = pickIndex(["type", "asset type"]);

  if (symbolIndex === null) {
    throw new Error("Positions import requires a Symbol column.");
  }

  await prisma.positionSnapshot.deleteMany({ where: { date: asOfDate } });

  for (const row of dataRows) {
    const symbol = row[symbolIndex]?.trim();
    if (!symbol) continue;

    await prisma.positionSnapshot.create({
      data: {
        date: asOfDate,
        accountNumber:
          accountNumberIndex !== null ? row[accountNumberIndex] : null,
        accountName: accountNameIndex !== null ? row[accountNameIndex] : null,
        symbol,
        description: descriptionIndex !== null ? row[descriptionIndex] : null,
        quantity: parseNumber(quantityIndex !== null ? row[quantityIndex] : undefined),
        lastPrice: parseNumber(lastPriceIndex !== null ? row[lastPriceIndex] : undefined),
        currentValue: parseNumber(
          currentValueIndex !== null ? row[currentValueIndex] : undefined
        ),
        totalGainLoss: parseNumber(
          totalGainLossIndex !== null ? row[totalGainLossIndex] : undefined
        ),
        totalGainLossPercent: parseNumber(
          totalGainLossPercentIndex !== null ? row[totalGainLossPercentIndex] : undefined
        ),
        percentOfAccount: parseNumber(
          percentOfAccountIndex !== null ? row[percentOfAccountIndex] : undefined
        ),
        costBasisTotal: parseNumber(costBasisIndex !== null ? row[costBasisIndex] : undefined),
        averageCostBasis: parseNumber(avgCostIndex !== null ? row[avgCostIndex] : undefined),
        assetType: typeIndex !== null ? row[typeIndex] : null,
      },
    });
  }

  revalidatePath("/holdings");
  revalidatePath("/admin/import");
}

export async function importFidelityHistory(formData: FormData) {
  const file = requireFile(formData, "history");
  const text = await readFileText(file);
  const rawRows: string[][] = parseRaw(text, { skip_empty_lines: true });
  const headerIndex = rawRows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === "run date")
  );

  if (headerIndex < 0) {
    throw new Error("History import missing header row.");
  }

  const headers = rawRows[headerIndex].map(normalizeHeader);
  const dataRows = rawRows.slice(headerIndex + 1);

  function getCell(row: string[], key: string) {
    const index = headers.findIndex((header) => header === key);
    return index >= 0 ? row[index] : undefined;
  }

  for (const row of dataRows) {
    const date = parseDate(getCell(row, "run date"));
    const action = parseAction(getCell(row, "action"));
    const symbol = getCell(row, "symbol")?.trim();
    const shares = parseNumber(getCell(row, "quantity"));
    const price = parseNumber(getCell(row, "price ($)"));

    if (!date || !action || !symbol || shares === null || price === null) {
      continue;
    }

    const commission = parseNumber(getCell(row, "commission ($)")) || 0;
    const fees = parseNumber(getCell(row, "fees ($)")) || 0;

    await prisma.trade.create({
      data: {
        date,
        ticker: symbol,
        action,
        shares,
        price,
        fees: commission + fees,
        assetType: inferAssetType(getCell(row, "type"), symbol),
        notes: getCell(row, "action") || null,
      },
    });
  }

  revalidatePath("/holdings");
  revalidatePath("/admin/import");
}

export async function importLivePrices(formData: FormData) {
  const file = requireFile(formData, "livePrices");
  const text = await readFileText(file);
  const rows: string[][] = parseRaw(text, { skip_empty_lines: false });

  const headerIndex = rows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === "symbol")
  );
  if (headerIndex < 0) {
    throw new Error("Live prices file missing a Symbol header.");
  }

  const headers = rows[headerIndex].map((cell) => normalizeHeader(cell));
  const dataRows = rows.slice(headerIndex + 1);

  const asOfDateInput = formData.get("livePricesDate")?.toString();
  const asOfDate =
    parseDate(asOfDateInput) || parseDateFromFilename(getFileName(file)) || new Date();

  function getCell(row: string[], key: string) {
    const index = headers.findIndex((header) => header === key);
    return index >= 0 ? row[index] : undefined;
  }

  await prisma.livePosition.deleteMany({ where: { date: asOfDate } });

  for (const row of dataRows) {
    const symbol = getCell(row, "symbol")?.trim();
    if (!symbol) continue;

    await prisma.livePosition.create({
      data: {
        date: asOfDate,
        symbol,
        quantity: parseNumber(getCell(row, "qty")),
        asset: getCell(row, "asset") || null,
        price: parseNumber(getCell(row, "price")),
        cost: parseNumber(getCell(row, "cost")),
        marketValue: parseNumber(getCell(row, "mkt value")),
        gainDollar: parseNumber(getCell(row, "gain ($)")),
        gainPercent: parseNumber(getCell(row, "gain (%)")),
        percentOfPortfolio: parseNumber(getCell(row, "% of portfolio")),
        term: getCell(row, "term") || null,
        beta: parseNumber(getCell(row, "beta")),
        pe: parseNumber(getCell(row, "p/e")),
        weekHigh: parseNumber(getCell(row, "52 wk high")),
        weekLow: parseNumber(getCell(row, "52 wk low")),
        gain30: parseNumber(getCell(row, "30 day gain")),
        gain60: parseNumber(getCell(row, "60 day gain")),
        gain90: parseNumber(getCell(row, "90 day gain")),
        weight: parseNumber(getCell(row, "weight")),
        estPurchase: parseNumber(getCell(row, "est. purchase")),
        sharesTarget: parseNumber(getCell(row, "# shares")),
        rounded: parseNumber(getCell(row, "rounded")),
        totalPurchase: parseNumber(getCell(row, "total purchase")),
      },
    });
  }

  revalidatePath("/holdings");
  revalidatePath("/admin/import");
}

export async function refreshQuotes() {
  await refreshMarketQuotes();
  revalidatePath("/holdings");
  revalidatePath("/admin/import");
}
