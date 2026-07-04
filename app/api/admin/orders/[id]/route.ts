import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { deleteOrder, getCustomer, getEmployee, getOrder, updateOrder } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  PAYMENT_STATUSES, PAYMENT_STATUS_META, STATUS_META, STATUSES, type OrderStatus, type PaymentStatus,
} from "@/lib/orders";

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

  const order = await getOrder(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return cached(NextResponse.json({ order }), 8);
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
    customerId?: number;
    address?: string;
    bottles?: number;
    ratePerBottle?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    assignedEmployeeId?: number | null;
  } = {};

  if (body.customerId !== undefined) {
    const v = Number(body.customerId);
    if (!Number.isInteger(v) || v <= 0) {
      return NextResponse.json({ error: "Invalid customer." }, { status: 400 });
    }
    const customer = await getCustomer(v);
    if (!customer) {
      return NextResponse.json({ error: "That customer no longer exists." }, { status: 400 });
    }
    update.customerId = v;
  }
  if (body.address !== undefined) {
    const v = String(body.address).trim();
    if (!v) return NextResponse.json({ error: "Address cannot be empty." }, { status: 400 });
    update.address = v;
  }
  if (body.bottles !== undefined) {
    const v = Number(body.bottles);
    if (!Number.isFinite(v) || v <= 0 || !Number.isInteger(v)) {
      return NextResponse.json(
        { error: "Number of bottles must be a positive whole number." },
        { status: 400 }
      );
    }
    update.bottles = v;
  }
  if (body.ratePerBottle !== undefined) {
    const v = Number(body.ratePerBottle);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json(
        { error: "Rate per bottle must be a positive number." },
        { status: 400 }
      );
    }
    update.ratePerBottle = v;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
  }
  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return NextResponse.json({ error: "Invalid payment status." }, { status: 400 });
    }
    update.paymentStatus = body.paymentStatus;
  }
  if (body.assignedEmployeeId !== undefined) {
    if (body.assignedEmployeeId === null || body.assignedEmployeeId === "") {
      update.assignedEmployeeId = null;
    } else {
      const v = Number(body.assignedEmployeeId);
      if (!Number.isInteger(v) || v <= 0) {
        return NextResponse.json({ error: "Invalid assigned employee." }, { status: 400 });
      }
      const employee = await getEmployee(v);
      if (!employee) {
        return NextResponse.json({ error: "That employee no longer exists." }, { status: 400 });
      }
      update.assignedEmployeeId = v;
    }
  }

  try {
    const before = await getOrder(id);
    const order = await updateOrder(id, update);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (
      update.assignedEmployeeId !== undefined &&
      update.assignedEmployeeId !== null &&
      update.assignedEmployeeId !== before?.assignedEmployeeId
    ) {
      const customer = await getCustomer(order.customerId);
      await notify(
        { role: "employee", id: update.assignedEmployeeId },
        "New order assigned",
        `Order #${order.id} for ${customer?.name ?? "a customer"} — ${order.bottles} bottle${order.bottles > 1 ? "s" : ""}.`,
        "/staff"
      );
    }

    if (update.status !== undefined && update.status !== before?.status) {
      await notify(
        { role: "customer", id: order.customerId },
        "Order status updated",
        `Your order #${order.id} is now ${STATUS_META[order.status].label.toLowerCase()}.`,
        "/portal"
      );
    }

    if (update.paymentStatus !== undefined && update.paymentStatus !== before?.paymentStatus) {
      await notify(
        { role: "customer", id: order.customerId },
        "Payment updated",
        `Payment for order #${order.id} is now marked as ${PAYMENT_STATUS_META[order.paymentStatus].label.toLowerCase()}.`,
        "/portal"
      );
    }

    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update order" },
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
    await deleteOrder(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete order" },
      { status: 500 }
    );
  }
}
