import { NextRequest, NextResponse } from "next/server";
import { createOrder, listOrders } from "@/lib/db";
import { STATUSES, type OrderStatus } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  if (status && !STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  try {
    const orders = await listOrders({
      status: (status as OrderStatus) || undefined,
      search: search || undefined,
    });
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const customerName = String(body?.customerName ?? "").trim();
  const address = String(body?.address ?? "").trim();
  const bottles = Number(body?.bottles);
  const ratePerBottle = Number(body?.ratePerBottle);
  const status = (body?.status || "pending") as OrderStatus;

  if (!customerName || !address) {
    return NextResponse.json(
      { error: "Customer name and address are required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(bottles) || bottles <= 0 || !Number.isInteger(bottles)) {
    return NextResponse.json(
      { error: "Number of bottles must be a positive whole number." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(ratePerBottle) || ratePerBottle <= 0) {
    return NextResponse.json(
      { error: "Rate per bottle must be a positive number." },
      { status: 400 }
    );
  }
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const order = await createOrder({ customerName, address, bottles, ratePerBottle, status });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create order" },
      { status: 500 }
    );
  }
}
