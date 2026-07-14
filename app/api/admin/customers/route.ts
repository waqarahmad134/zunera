import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { createCustomer, isPhoneInUse, listCustomers } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");
  try {
    const customers = await listCustomers(search || undefined);
    return cached(NextResponse.json({ customers }), 20);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name ?? "").trim();
  const address = String(body?.address ?? "").trim();
  const phone = body?.phone ? String(body.phone).trim() : "";
  const password = body?.password ? String(body.password) : "";
  const houseNo = body?.houseNo ? String(body.houseNo).trim() || null : null;
  const notes = body?.notes ? String(body.notes).trim() || null : null;

  if (!name) {
    return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }
  if (password && !phone) {
    return NextResponse.json(
      { error: "A phone number is required to set a portal password." },
      { status: 400 }
    );
  }
  if (phone && (await isPhoneInUse(phone))) {
    return NextResponse.json(
      { error: "This phone number is already used by another employee or customer account." },
      { status: 409 }
    );
  }

  let defaultRatePerBottle: number | null = null;
  if (body?.defaultRatePerBottle !== undefined && body.defaultRatePerBottle !== "") {
    const v = Number(body.defaultRatePerBottle);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Default rate per bottle must be a positive number." }, { status: 400 });
    }
    defaultRatePerBottle = v;
  }

  let openingBalance = 0;
  if (body?.openingBalance !== undefined && body.openingBalance !== "") {
    const v = Number(body.openingBalance);
    if (!Number.isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Opening balance must be zero or more." }, { status: 400 });
    }
    openingBalance = v;
  }

  try {
    const passwordHash = password ? await hashPassword(password) : null;
    const customer = await createCustomer(
      { name, address, phone, houseNo, defaultRatePerBottle, openingBalance, notes },
      passwordHash
    );
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create customer" },
      { status: 500 }
    );
  }
}
