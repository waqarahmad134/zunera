import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { createPaymentIn, getCustomer, listPaymentsIn } from "@/lib/db";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payments";

export async function GET(req: NextRequest) {
  const customerIdRaw = req.nextUrl.searchParams.get("customerId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const customerId = customerIdRaw ? Number(customerIdRaw) : undefined;
  if (customerIdRaw && (!Number.isInteger(customerId) || customerId! <= 0)) {
    return NextResponse.json({ error: "Invalid customerId filter" }, { status: 400 });
  }

  try {
    const payments = await listPaymentsIn({
      customerId,
      from: from || undefined,
      to: to || undefined,
    });
    return cached(NextResponse.json({ payments }), 8);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const customerId = Number(body?.customerId);
  const amount = Number(body?.amount);
  const paymentDate = String(body?.paymentDate ?? "").trim();
  const method = (body?.method || "cash") as PaymentMethod;
  const note = body?.note ? String(body.note).trim() || null : null;

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return NextResponse.json({ error: "Select a customer for this payment." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }
  if (!PAYMENT_METHODS.includes(method)) {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }

  const customer = await getCustomer(customerId);
  if (!customer) {
    return NextResponse.json({ error: "That customer no longer exists." }, { status: 400 });
  }

  try {
    const payment = await createPaymentIn({ customerId, amount, paymentDate, method, note });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not record payment" },
      { status: 500 }
    );
  }
}
