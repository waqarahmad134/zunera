import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { createPurchase, getItem, getSupplier, listPurchases } from "@/lib/db";

export async function GET() {
  try {
    const purchases = await listPurchases();
    return cached(NextResponse.json({ purchases }), 8);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load purchases" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const supplierId = Number(body?.supplierId);
  const receivedDate = String(body?.receivedDate ?? "").trim();
  const receiptNo = body?.receiptNo ? String(body.receiptNo).trim() || null : null;
  const notes = body?.notes ? String(body.notes).trim() || null : null;
  const rawLines = Array.isArray(body?.lines) ? body.lines : [];

  if (!Number.isInteger(supplierId) || supplierId <= 0) {
    return NextResponse.json({ error: "Select a supplier for this purchase." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedDate)) {
    return NextResponse.json({ error: "A valid received date is required." }, { status: 400 });
  }
  if (rawLines.length === 0) {
    return NextResponse.json({ error: "Add at least one item line." }, { status: 400 });
  }

  const supplier = await getSupplier(supplierId);
  if (!supplier) {
    return NextResponse.json({ error: "That supplier no longer exists." }, { status: 400 });
  }

  const lines: { itemId: number; qty: number; unitCost: number }[] = [];
  for (const raw of rawLines) {
    const itemId = Number(raw?.itemId);
    const qty = Number(raw?.qty);
    const unitCost = Number(raw?.unitCost);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ error: "Every line needs an item selected." }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return NextResponse.json({ error: "Quantity must be a positive whole number." }, { status: 400 });
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      return NextResponse.json({ error: "Unit cost must be zero or more." }, { status: 400 });
    }
    const item = await getItem(itemId);
    if (!item) {
      return NextResponse.json({ error: "One of the selected items no longer exists." }, { status: 400 });
    }
    lines.push({ itemId, qty, unitCost });
  }

  try {
    const purchase = await createPurchase({ supplierId, receiptNo, receivedDate, notes, lines });
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create purchase" },
      { status: 500 }
    );
  }
}
