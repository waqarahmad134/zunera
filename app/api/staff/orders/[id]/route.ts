// Staff can only ever move an order's status forward — no other field on
// the order is accepted here, and there's no POST/DELETE in this file at
// all, so an employee session can't create or delete orders.
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/current-session";
import { getCustomer, updateOrder } from "@/lib/db";
import { notify } from "@/lib/notify";
import { STATUS_META, STATUSES, type OrderStatus } from "@/lib/orders";

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

  const session = await getCurrentSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== "string" || !STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "A valid status is required." }, { status: 400 });
  }

  try {
    const order = await updateOrder(id, { status: status as OrderStatus });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const customer = await getCustomer(order.customerId);
    await notify(
      { role: "admin" },
      "Order status updated",
      `${session.name ?? "An employee"} marked order #${order.id} (${customer?.name ?? "customer"}) as ${STATUS_META[order.status].label}.`,
      "/admin/orders"
    );
    await notify(
      { role: "customer", id: order.customerId },
      "Order status updated",
      `Your order #${order.id} is now ${STATUS_META[order.status].label.toLowerCase()}.`,
      "/portal"
    );

    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update order" },
      { status: 500 }
    );
  }
}
