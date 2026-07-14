import { NextRequest, NextResponse } from "next/server";
import { deleteSupplier, updateSupplier } from "@/lib/db";

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
    phone?: string | null;
    address?: string | null;
    openingBalance?: number;
    notes?: string | null;
  } = {};

  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: "Supplier name cannot be empty." }, { status: 400 });
    update.name = v;
  }
  if (body.phone !== undefined) {
    update.phone = body.phone ? String(body.phone).trim() || null : null;
  }
  if (body.address !== undefined) {
    update.address = body.address ? String(body.address).trim() || null : null;
  }
  if (body.notes !== undefined) {
    update.notes = body.notes ? String(body.notes).trim() || null : null;
  }
  if (body.openingBalance !== undefined) {
    const v = Number(body.openingBalance);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Opening balance must be zero or more." }, { status: 400 });
    }
    update.openingBalance = v;
  }

  try {
    const supplier = await updateSupplier(id, update);
    if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json({ supplier });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update supplier" },
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
    await deleteSupplier(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete supplier" },
      { status: 500 }
    );
  }
}
