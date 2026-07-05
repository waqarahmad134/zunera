import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { deleteCustomer, getCustomer, getCustomerSummary, isPhoneInUse, updateCustomer } from "@/lib/db";
import { hashPassword } from "@/lib/password";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const customer = await getCustomer(id);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  const summary = await getCustomerSummary(id);
  return cached(NextResponse.json({ customer, summary }), 15);
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
    address?: string;
    defaultRatePerBottle?: number | null;
    passwordHash?: string | null;
  } = {};

  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: "Customer name cannot be empty." }, { status: 400 });
    update.name = v;
  }
  if (body.address !== undefined) {
    const v = String(body.address).trim();
    if (!v) return NextResponse.json({ error: "Address cannot be empty." }, { status: 400 });
    update.address = v;
  }
  if (body.phone !== undefined) {
    const v = body.phone ? String(body.phone).trim() : null;
    if (v && (await isPhoneInUse(v, { customerId: id }))) {
      return NextResponse.json(
        { error: "This phone number is already used by another employee or customer account." },
        { status: 409 }
      );
    }
    update.phone = v;
  }
  if (body.defaultRatePerBottle !== undefined) {
    if (body.defaultRatePerBottle === "" || body.defaultRatePerBottle === null) {
      update.defaultRatePerBottle = null;
    } else {
      const v = Number(body.defaultRatePerBottle);
      if (!Number.isFinite(v) || v <= 0) {
        return NextResponse.json({ error: "Default rate per bottle must be a positive number." }, { status: 400 });
      }
      update.defaultRatePerBottle = v;
    }
  }
  if (body.password) {
    const existing = await getCustomer(id);
    if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    const phoneAfterUpdate = update.phone !== undefined ? update.phone : existing.phone;
    if (!phoneAfterUpdate) {
      return NextResponse.json(
        { error: "A phone number is required to set a portal password." },
        { status: 400 }
      );
    }
    update.passwordHash = await hashPassword(String(body.password));
  }

  try {
    const customer = await updateCustomer(id, update);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update customer" },
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
    await deleteCustomer(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete customer" },
      { status: 409 }
    );
  }
}
