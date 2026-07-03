// customerId comes strictly from the verified session — never from a
// client-supplied parameter — so one customer can never read another's data.
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/current-session";
import { getCustomer, getCustomerSummary, listOrders } from "@/lib/db";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== "customer" || !session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await getCustomer(session.id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [summary, orders] = await Promise.all([
    getCustomerSummary(session.id),
    listOrders({ customerId: session.id }),
  ]);
  return NextResponse.json({ customer, summary, orders });
}
