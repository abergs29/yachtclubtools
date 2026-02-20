import { NextResponse } from "next/server";
import { refreshMarketQuotes } from "@/lib/market-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const normalize = (value: string | null | undefined) => value?.trim() ?? "";
  const secret = normalize(process.env.MARKET_QUOTES_SECRET);
  const provided = normalize(
    request.headers.get("x-refresh-secret") ??
      new URL(request.url).searchParams.get("secret"),
  );

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshMarketQuotes();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
