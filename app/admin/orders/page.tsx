"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check, ChevronRight, Loader2, Plus, Save, Search, Trash2, TriangleAlert,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import Drawer from "@/components/Drawer";
import OrderForm, { type OrderFormValue } from "@/components/OrderForm";
import PaymentBadge from "@/components/PaymentBadge";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate, type Order, type OrderStatus } from "@/lib/orders";

type Tab = "all" | OrderStatus;

function toFormValue(o: Order): OrderFormValue {
  return {
    // Synthesized from the order's own denormalized fields — good enough to
    // display in the picker's "selected" chip without an extra fetch. The
    // address shown here is this order's delivery address, which may differ
    // from the customer's own saved address if it was overridden.
    customer: {
      id: o.customerId,
      name: o.customerName,
      phone: null,
      address: o.address,
      houseNo: null,
      defaultRatePerBottle: null,
      notes: null,
      createdAt: "",
      updatedAt: "",
    },
    address: o.address,
    bottles: o.bottles,
    ratePerBottle: o.ratePerBottle,
    status: o.status,
    paymentStatus: o.paymentStatus,
    assignedEmployeeId: o.assignedEmployeeId,
    notes: o.notes ?? "",
  };
}

export default function OrdersPage() {
  const { confirm } = useDialogs();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState<OrderFormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    // no-store: this runs right after a create/update/delete, so the
    // admin who just made the change must see it immediately, not a
    // response cached from before their edit.
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.ok) setOrders((await res.json()).orders);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => {
        if (!cancelled) setOrders(d.orders);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (q && !o.customerName.toLowerCase().includes(q) && !o.address.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [orders, tab, search]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: orders?.length ?? 0, pending: 0, delivered: 0, cancelled: 0 };
    for (const o of orders ?? []) c[o.status]++;
    return c;
  }, [orders]);

  const openOrder = openId !== null ? orders?.find((o) => o.id === openId) ?? null : null;

  function openDrawer(o: Order) {
    setOpenId(o.id);
    setForm(toFormValue(o));
    setMsg(null);
  }

  function closeDrawer() {
    setOpenId(null);
    setForm(null);
  }

  async function save() {
    if (!openOrder || !form) return;
    if (!form.customer || !form.address.trim()) {
      setMsg({ ok: false, text: "Customer and address are required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${openOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customer.id,
          address: form.address.trim(),
          bottles: form.bottles,
          ratePerBottle: form.ratePerBottle,
          status: form.status,
          paymentStatus: form.paymentStatus,
          assignedEmployeeId: form.assignedEmployeeId,
          notes: form.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      setSaving(false);
      if (!res.ok) {
        setMsg({ ok: false, text: body.error || "Save failed." });
        return;
      }
      await load();
      setMsg({ ok: true, text: "Saved." });
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
  }

  async function remove(o: Order) {
    const ok = await confirm({
      title: `Delete the order for "${o.customerName}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/orders/${o.id}`, { method: "DELETE" });
    if (res.ok) {
      closeDrawer();
      await load();
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <AdminShell title="Orders">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Orders</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Every bottle order placed with Jubilee Water.
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors"
        >
          <Plus size={15} /> Add new
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-ink text-white"
                  : "text-ink-soft hover:bg-paper-soft border border-line"
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

      <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
        {orders === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">
            {orders.length === 0
              ? "No orders yet. Use “Add new” to create the first one."
              : "No orders match this filter."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Customer
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Address
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Bottles
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Total
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Payment
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openDrawer(o)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-soft/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                      <Link
                        href={`/admin/customers/${o.customerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-accent transition-colors"
                      >
                        {o.customerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft max-w-[240px] truncate" title={o.address}>
                      {o.address}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{o.bottles}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">
                      {formatCurrency(o.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(o);
                          }}
                          title="Delete"
                          className="p-1.5 text-ink-soft hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={15} className="text-ink-soft" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={openOrder !== null}
        onClose={closeDrawer}
        title={openOrder?.customerName || ""}
        subtitle={openOrder ? `Order #${openOrder.id} · ${formatDate(openOrder.createdAt)}` : undefined}
        footer={
          <>
            <button
              onClick={() => openOrder && remove(openOrder)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
            <div className="ml-auto flex items-center gap-3">
              {msg && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs ${
                    msg.ok ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {msg.ok ? <Check size={14} /> : <TriangleAlert size={14} />}
                  {msg.text}
                </span>
              )}
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        }
      >
        {form && (
          <OrderForm
            value={form}
            onChange={setForm}
            statusLockedByEmployee={openOrder?.statusLockedByEmployee}
            paymentLockedByEmployee={openOrder?.paymentLockedByEmployee}
          />
        )}
      </Drawer>
    </AdminShell>
  );
}
