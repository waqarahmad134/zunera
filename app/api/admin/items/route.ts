import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { createItem, listItems } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");
  try {
    const items = await listItems(search || undefined);
    return cached(NextResponse.json({ items }), 20);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name ?? "").trim();
  const notes = body?.notes ? String(body.notes).trim() || null : null;
  const returnable = !!body?.returnable;

  if (!name) {
    return NextResponse.json({ error: "Item name is required." }, { status: 400 });
  }

  const cost = body?.cost === undefined || body.cost === "" ? 0 : Number(body.cost);
  if (!Number.isFinite(cost) || cost < 0) {
    return NextResponse.json({ error: "Cost must be zero or more." }, { status: 400 });
  }

  const margin = body?.margin === undefined || body.margin === "" ? 0 : Number(body.margin);
  if (!Number.isFinite(margin) || margin < 0) {
    return NextResponse.json({ error: "Margin must be zero or more." }, { status: 400 });
  }

  const openingStock =
    body?.openingStock === undefined || body.openingStock === "" ? 0 : Number(body.openingStock);
  if (!Number.isInteger(openingStock) || openingStock < 0) {
    return NextResponse.json({ error: "Opening stock must be a whole number, zero or more." }, { status: 400 });
  }

  try {
    const item = await createItem({ name, cost, margin, returnable, openingStock, notes });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create item" },
      { status: 500 }
    );
  }
}
