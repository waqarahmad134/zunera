// Staff can update an order's status and/or payment status — no other
// field, and no POST/DELETE in this file at all, so an employee session
// can't create or delete orders. Each of status/paymentStatus can only be
// changed by an employee ONCE per order: after that, the matching
// *_locked_by_employee flag stops any further employee change to that
// field (only admin can adjust it after that).
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/current-session";
import { getCustomer, getOrder, updateOrder } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  PAYMENT_STATUSES, PAYMENT_STATUS_META, STATUS_META, STATUSES,
  type OrderStatus, type PaymentStatus,
} from "@/lib/orders";

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
  const hasStatus = body?.status !== undefined;
  const hasPayment = body?.paymentStatus !== undefined;

  if (!hasStatus && !hasPayment) {
    return NextResponse.json({ error: "A status or payment status is required." }, { status: 400 });
  }
  if (hasStatus && (typeof body.status !== "string" || !STATUSES.includes(body.status as OrderStatus))) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (hasPayment && (typeof body.paymentStatus !== "string" || !PAYMENT_STATUSES.includes(body.paymentStatus as PaymentStatus))) {
    return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
  }

  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (hasStatus && order.statusLockedByEmployee) {
    return NextResponse.json(
      { error: "This order's status was already updated once and is now locked. Ask an admin to change it further." },
      { status: 403 }
    );
  }
  if (hasPayment && order.paymentLockedByEmployee) {
    return NextResponse.json(
      { error: "This order's payment status was already updated once and is now locked. Ask an admin to change it further." },
      { status: 403 }
    );
  }

  try {
    const updated = await updateOrder(id, {
      status: hasStatus ? (body.status as OrderStatus) : undefined,
      paymentStatus: hasPayment ? (body.paymentStatus as PaymentStatus) : undefined,
      statusLockedByEmployee: hasStatus ? true : undefined,
      paymentLockedByEmployee: hasPayment ? true : undefined,
    });
    if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const customer = await getCustomer(updated.customerId);

    if (hasStatus) {
      await notify(
        { role: "admin" },
        "Order status updated",
        `${session.name ?? "An employee"} marked order #${updated.id} (${customer?.name ?? "customer"}) as ${STATUS_META[updated.status].label}.`,
        "/admin/orders"
      );
      await notify(
        { role: "customer", id: updated.customerId },
        "Order status updated",
        `Your order #${updated.id} is now ${STATUS_META[updated.status].label.toLowerCase()}.`,
        "/portal"
      );
    }
    if (hasPayment) {
      await notify(
        { role: "admin" },
        "Payment updated",
        `${session.name ?? "An employee"} marked payment for order #${updated.id} (${customer?.name ?? "customer"}) as ${PAYMENT_STATUS_META[updated.paymentStatus].label}.`,
        "/admin/orders"
      );
      await notify(
        { role: "customer", id: updated.customerId },
        "Payment updated",
        `Payment for order #${updated.id} is now marked as ${PAYMENT_STATUS_META[updated.paymentStatus].label.toLowerCase()}.`,
        "/portal"
      );
    }

    return NextResponse.json({ order: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update order" },
      { status: 500 }
    );
  }
}
