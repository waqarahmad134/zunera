import { NextRequest, NextResponse } from "next/server";
import { deleteItem, updateItem } from "@/lib/db";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const update: {
    name?: string;
    cost?: number;
    margin?: number;
    returnable?: boolean;
    openingStock?: number;
    notes?: string | null;
  } = {};

  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: "Item name cannot be empty." }, { status: 400 });
    update.name = v;
  }
  if (body.cost !== undefined) {
    const v = Number(body.cost);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Cost must be zero or more." }, { status: 400 });
    }
    update.cost = v;
  }
  if (body.margin !== undefined) {
    const v = Number(body.margin);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Margin must be zero or more." }, { status: 400 });
    }
    update.margin = v;
  }
  if (body.returnable !== undefined) {
    update.returnable = !!body.returnable;
  }
  if (body.openingStock !== undefined) {
    const v = Number(body.openingStock);
    if (!Number.isInteger(v) || v < 0) {
      return NextResponse.json({ error: "Opening stock must be a whole number, zero or more." }, { status: 400 });
    }
    update.openingStock = v;
  }
  if (body.notes !== undefined) {
    update.notes = body.notes ? String(body.notes).trim() || null : null;
  }

  try {
    const item = await updateItem(id, update);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete item" },
      { status: 500 }
    );
  }
}
