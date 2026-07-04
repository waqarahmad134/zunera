"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Lock, Search } from "lucide-react";
import StaffShell from "@/components/StaffShell";
import PaymentBadge from "@/components/PaymentBadge";
import StatusBadge from "@/components/StatusBadge";
import {
  PAYMENT_STATUSES, PAYMENT_STATUS_META, STATUS_META, STATUSES,
  formatCurrency, formatDate, type Order, type OrderStatus, type PaymentStatus,
} from "@/lib/orders";

type Tab = "all" | OrderStatus;

export default function StaffPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    // no-store: runs right after the employee updates a status, so they
    // see it reflected immediately instead of a cached pre-update response.
    const res = await fetch("/api/staff/orders", { cache: "no-store" });
    if (res.ok) setOrders((await res.json()).orders);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const res = await fetch("/api/staff/orders").catch(() => null);
      if (!res?.ok || cancelled) return;
      const body = await res.json();
      setOrders(body.orders);
    }
    poll();
    // Picks up new assignments or admin-side changes without a manual reload.
    const handle = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (q && !o.customerName.toLowerCase().includes(q) && !o.address.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, tab, search]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: orders?.length ?? 0, pending: 0, delivered: 0, cancelled: 0 };
    for (const o of orders ?? []) c[o.status]++;
    return c;
  }, [orders]);

  async function setStatus(order: Order, status: OrderStatus) {
    if (status === order.status || order.statusLockedByEmployee) return;
    setUpdatingId(order.id);
    const res = await fetch(`/api/staff/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => ({}));
    setUpdatingId(null);
    if (res.ok) await load();
    else alert(body.error || "Could not update status.");
  }

  async function setPayment(order: Order, paymentStatus: PaymentStatus) {
    if (paymentStatus === order.paymentStatus || order.paymentLockedByEmployee) return;
    setUpdatingId(order.id);
    const res = await fetch(`/api/staff/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    const body = await res.json().catch(() => ({}));
    setUpdatingId(null);
    if (res.ok) await load();
    else alert(body.error || "Could not update payment.");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <StaffShell title="My deliveries">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Deliveries</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Every order — update the status once you&apos;ve delivered or if it&apos;s cancelled.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-ink text-white" : "text-ink-soft hover:bg-paper-soft border border-line"
              }`}
            >
              {t.label} <span className="opacity-60">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or address"
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {orders === null ? (
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-white p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-ink-soft">
            No orders match this filter.
          </p>
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{o.customerName}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{o.address}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={o.status} />
                  <PaymentBadge status={o.paymentStatus} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-soft">
                <span>{o.bottles} bottles</span>
                <span className="font-medium text-ink">{formatCurrency(o.totalPrice)}</span>
                <span>{formatDate(o.createdAt)}</span>
                {o.assignedEmployeeName && <span>Assigned: {o.assignedEmployeeName}</span>}
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                Delivery status
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => {
                  const active = o.status === s;
                  const meta = STATUS_META[s];
                  return (
                    <button
                      key={s}
                      disabled={updatingId === o.id || o.statusLockedByEmployee}
                      onClick={() => setStatus(o, s)}
                      style={active ? { background: meta.bg, borderColor: meta.color, color: meta.color } : undefined}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                        active ? "" : "border-line text-ink-soft hover:border-ink-soft"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
                {o.statusLockedByEmployee && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-soft/70">
                    <Lock size={11} /> Locked — ask admin to change it further
                  </span>
                )}
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Payment</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {PAYMENT_STATUSES.map((s) => {
                  const active = o.paymentStatus === s;
                  const meta = PAYMENT_STATUS_META[s];
                  return (
                    <button
                      key={s}
                      disabled={updatingId === o.id || o.paymentLockedByEmployee}
                      onClick={() => setPayment(o, s)}
                      style={active ? { background: meta.bg, borderColor: meta.color, color: meta.color } : undefined}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                        active ? "" : "border-line text-ink-soft hover:border-ink-soft"
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
                {o.paymentLockedByEmployee && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-soft/70">
                    <Lock size={11} /> Locked — ask admin to change it further
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </StaffShell>
  );
}
