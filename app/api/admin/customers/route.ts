import { NextRequest, NextResponse } from "next/server";
import { createCustomer, listCustomers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");
  try {
    const customers = await listCustomers(search || undefined);
    return NextResponse.json({ customers });
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

  if (!name) {
    return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }

  try {
    const customer = await createCustomer({ name, address, phone });
    return NextResponse.json({ customer }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create customer" },
      { status: 500 }
    );
  }
}
