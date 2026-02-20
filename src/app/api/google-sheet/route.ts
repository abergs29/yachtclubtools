import { NextResponse } from "next/server";
import { parse as parseRaw } from "csv-parse/sync";

export const dynamic = "force-dynamic";

function isLikelyHtml(payload: string) {
  const trimmed = payload.trim();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<!DOCTYPE html")
  );
}

async function fetchGoogleSheetCsvRows(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch public CSV from Google Sheets (${response.status}).`
    );
  }

  const csv = await response.text();
  if (isLikelyHtml(csv)) {
    throw new Error(
      "Google Sheets CSV endpoint returned HTML. Verify GOOGLE_SHEETS_CSV_URL is a published export URL."
    );
  }

  const rows = parseRaw(csv, {
    skip_empty_lines: true,
    relax_column_count: true,
  }) as string[][];
  return mapValuesToRows(rows);
}

function buildPublicCsvUrl(sheetId: string, gid?: string) {
  const params = new URLSearchParams({ format: "csv" });
  if (gid) params.set("gid", gid);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?${params.toString()}`;
}

function mapValuesToRows(values: string[][]) {
  if (values.length === 0) return [] as Record<string, string>[];
  const [headers, ...rows] = values;
  return rows.map((row) => {
    const entry: Record<string, string> = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] ?? "";
    });
    return entry;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetId = process.env.GOOGLE_SHEETS_SHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const range = process.env.GOOGLE_SHEETS_RANGE;
  const csvUrl = process.env.GOOGLE_SHEETS_CSV_URL;
  const gid = searchParams.get("gid") || process.env.GOOGLE_SHEETS_GID || undefined;

  if (csvUrl) {
    try {
      const rows = await fetchGoogleSheetCsvRows(csvUrl.trim());
      return NextResponse.json({ source: "csv", count: rows.length, rows });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to parse Google Sheets CSV.",
        },
        { status: 502 }
      );
    }
  }

  if (sheetId && apiKey && range) {
    const url = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
        range
      )}`
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("majorDimension", "ROWS");

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Google Sheets values.", status: response.status },
        { status: 502 }
      );
    }
    const data = (await response.json()) as { values?: string[][] };
    const rows = mapValuesToRows(data.values ?? []);
    return NextResponse.json({ source: "api", count: rows.length, rows });
  }

  if (sheetId) {
    try {
      const url = buildPublicCsvUrl(sheetId, gid);
      const rows = await fetchGoogleSheetCsvRows(url);
      return NextResponse.json({ source: "public-csv", count: rows.length, rows });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch public CSV from Google Sheets.",
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    {
      error:
        "Missing Google Sheets configuration. Set GOOGLE_SHEETS_CSV_URL or GOOGLE_SHEETS_SHEET_ID (and optionally GOOGLE_SHEETS_API_KEY + GOOGLE_SHEETS_RANGE).",
    },
    { status: 500 }
  );
}
