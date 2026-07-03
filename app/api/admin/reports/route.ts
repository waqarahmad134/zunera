import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { getReport } from "@/lib/db";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!to || !DATE_RE.test(to) || (from && !DATE_RE.test(from))) {
    return NextResponse.json({ error: "to (and optionally from) must be YYYY-MM-DD." }, { status: 400 });
  }
  if (from && from > to) {
    return NextResponse.json({ error: "from must be before to." }, { status: 400 });
  }

  try {
    const report = await getReport(from, to);
    return cached(NextResponse.json(report), 20);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load report" },
      { status: 500 }
    );
  }
}
