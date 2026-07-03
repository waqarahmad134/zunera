import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { listOrders } from "@/lib/db";
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
    return cached(NextResponse.json({ orders }), 8);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load orders" },
      { status: 500 }
    );
  }
}
