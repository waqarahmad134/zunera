import { NextRequest, NextResponse } from "next/server";
import { createOrder, getCustomer, listOrders } from "@/lib/db";
import { STATUSES, type OrderStatus } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");
  const customerIdRaw = req.nextUrl.searchParams.get("customerId");

  if (status && !STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const customerId = customerIdRaw ? Number(customerIdRaw) : undefined;
  if (customerIdRaw && (!Number.isInteger(customerId) || customerId! <= 0)) {
    return NextResponse.json({ error: "Invalid customerId filter" }, { status: 400 });
  }

  try {
    const orders = await listOrders({
      status: (status as OrderStatus) || undefined,
      search: search || undefined,
      customerId,
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

  const customerId = Number(body?.customerId);
  const address = String(body?.address ?? "").trim();
  const bottles = Number(body?.bottles);
  const ratePerBottle = Number(body?.ratePerBottle);
  const status = (body?.status || "pending") as OrderStatus;

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "Select a customer for this order." }, { status: 400 });
  }
  if (!address) {
    return NextResponse.json({ error: "Delivery address is required." }, { status: 400 });
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
    const customer = await getCustomer(customerId);
    if (!customer) {
      return NextResponse.json({ error: "That customer no longer exists." }, { status: 400 });
    }
    const order = await createOrder({ customerId, address, bottles, ratePerBottle, status });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create order" },
      { status: 500 }
    );
  }
}
