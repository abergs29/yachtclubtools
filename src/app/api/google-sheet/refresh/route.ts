import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.GOOGLE_SHEETS_SECRET;
  const provided =
    request.headers.get("x-refresh-secret") ??
    new URL(request.url).searchParams.get("secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("sheet-metrics", "max");
  return NextResponse.json({ ok: true });
}
