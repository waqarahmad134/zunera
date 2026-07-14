import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { createSupplier, listSuppliers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search");
  try {
    const suppliers = await listSuppliers(search || undefined);
    return cached(NextResponse.json({ suppliers }), 20);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const name = String(body?.name ?? "").trim();
  const phone = body?.phone ? String(body.phone).trim() : "";
  const address = body?.address ? String(body.address).trim() : "";
  const notes = body?.notes ? String(body.notes).trim() || null : null;

  if (!name) {
    return NextResponse.json({ error: "Supplier name is required." }, { status: 400 });
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
    const supplier = await createSupplier({ name, phone, address, openingBalance, notes });
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create supplier" },
      { status: 500 }
    );
  }
}
