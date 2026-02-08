import { parse } from "csv-parse/sync";

export type CsvRecord = Record<string, string>;

export function parseCsv(input: string): CsvRecord[] {
  return parse(input, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

export function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const lowered = value.toLowerCase();
  if (lowered.includes("no purchase") || lowered === "no" || lowered === "n/a") {
    return null;
  }
  const cleaned = value
    .replace(/\ufeff/g, "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/\(([^)]+)\)/g, "-$1")
    .trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function normalizeHeader(header: string) {
  return header.replace(/\ufeff/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
