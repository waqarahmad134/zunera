import { NextRequest, NextResponse } from "next/server";
import { getSection } from "@/lib/adminConfig";
import { readSection, readSingleton, writeSection } from "@/lib/db";

// Content is stored in Cloudflare D1. Reads/writes go straight to the database
// in every environment (local dev uses the Miniflare D1 simulator), so there is
// no longer a dev-vs-prod split or a GitHub commit step.

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") ?? "";
  const def = getSection(section);
  if (!def) {
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }
  try {
    if (def.singleton) {
      const data = await readSingleton<Record<string, unknown>>(section, {});
      return NextResponse.json({ data });
    }
    const data = await readSection(section);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not read content" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const section: string = body?.section ?? "";
  const def = getSection(section);
  if (!def || body?.data === undefined) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  if (def.singleton ? Array.isArray(body.data) : !Array.isArray(body.data)) {
    return NextResponse.json({ error: "Wrong data shape" }, { status: 400 });
  }

  try {
    const items = def.singleton ? [body.data] : (body.data as unknown[]);
    await writeSection(section, items);
    return NextResponse.json({ ok: true, mode: "d1" });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 }
    );
  }
}
