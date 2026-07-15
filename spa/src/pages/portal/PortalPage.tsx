import { useEffect, useState } from "react";
import { Calendar, Loader2, Receipt, ShoppingBag, Wallet } from "lucide-react";
import PortalShell from "@/components/PortalShell";
import PaymentBadge from "@/components/PaymentBadge";
import StatusBadge from "@/components/StatusBadge";
import type { Customer, CustomerSummary } from "@/lib/types/customers";
import { formatCurrency, formatDate, type Order } from "@/lib/types/orders";
import { api } from "@/lib/api";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <span className="inline-flex rounded-full bg-accent-soft p-2 text-accent">
        <Icon size={15} />
      </span>
      <p className="mt-3 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
    </div>
  );
}

interface PortalMe {
  customer: Customer;
  summary: CustomerSummary;
  orders: Order[];
}

export default function PortalPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const body = await api.get<PortalMe>("/portal/me").catch(() => null);
      if (!body || cancelled) return;
      setCustomer(body.customer);
      setSummary(body.summary);
      setOrders(body.orders);
    }
    poll();
    // Picks up status changes an admin/employee makes elsewhere — a
    // customer shouldn't have to manually reload to see them.
    const handle = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  return (
    <PortalShell title="My account">
      {customer === null ? (
        <div className="flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hi, {customer.name}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Here&apos;s your order history with Jubilee Water.</p>

          {summary && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatTile icon={ShoppingBag} label="Orders" value={String(summary.orderCount)} />
              <StatTile icon={Wallet} label="Total spent" value={formatCurrency(summary.totalSpent)} />
              <StatTile
                icon={Calendar}
                label="Last order"
                value={summary.lastOrderAt ? formatDate(summary.lastOrderAt) : "—"}
              />
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line px-5 py-3.5">
              <Receipt size={15} className="text-ink-soft" />
              <h2 className="text-base font-semibold">Order history</h2>
            </div>
            {orders === null ? (
              <div className="flex items-center gap-2 p-8 text-sm text-ink-soft">
                <Loader2 size={16} className="animate-spin" /> Loading...
              </div>
            ) : orders.length === 0 ? (
              <p className="p-8 text-center text-sm text-ink-soft">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-paper-soft/60">
                      <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Address
                      </th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Bottles
                      </th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Total
                      </th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Status
                      </th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Payment
                      </th>
                      <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-line last:border-0">
                        <td className="px-5 py-3 text-ink-soft max-w-[260px] truncate" title={o.address}>
                          {o.address}
                        </td>
                        <td className="px-5 py-3 tabular-nums">{o.bottles}</td>
                        <td className="px-5 py-3 tabular-nums font-medium">{formatCurrency(o.totalPrice)}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-5 py-3">
                          <PaymentBadge status={o.paymentStatus} />
                        </td>
                        <td className="px-5 py-3 text-ink-soft whitespace-nowrap">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PortalShell>
  );
}
