import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Banknote, Calendar, Check, Home, Loader2, MapPin, Pencil, Phone, Plus,
  Receipt, Save, ShoppingBag, StickyNote, Trash2, TriangleAlert, User, Wallet, X,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import CustomerForm, { type CustomerFormValue } from "@/components/CustomerForm";
import PaymentBadge from "@/components/PaymentBadge";
import StatusBadge from "@/components/StatusBadge";
import { api, ApiError } from "@/lib/api";
import type { Customer, CustomerBalance, CustomerSummary } from "@/lib/types/customers";
import { formatCurrency, formatDate, type Order } from "@/lib/types/orders";

function MoneyRow({
  label,
  value,
  sign,
  strong = false,
}: {
  label: string;
  value: number;
  sign?: "+" | "−";
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${strong ? "" : "text-sm text-ink-soft"}`}>
      <span className={strong ? "text-sm font-semibold" : ""}>{label}</span>
      <span className={`tabular-nums ${strong ? "text-base font-semibold" : ""}`}>
        {sign ? `${sign} ` : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
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

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, alertDialog } = useDialogs();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CustomerFormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ customer: Customer; summary: CustomerSummary }>(`/admin/customers/${id}`)
      .then((body) => {
        if (cancelled) return;
        setCustomer(body.customer);
        setSummary(body.summary);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ orders: Order[] }>(`/admin/orders?customerId=${id}`)
      .then((d) => {
        if (!cancelled) setOrders(d.orders);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ balance: CustomerBalance }>(`/admin/customers/${id}/balance`)
      .then((d) => {
        if (!cancelled) setBalance(d.balance);
      })
      .catch(() => {
        // leave balance null on failure
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function startEdit() {
    if (!customer) return;
    setForm({
      name: customer.name,
      phone: customer.phone ?? "",
      houseNo: customer.houseNo ?? "",
      address: customer.address,
      defaultRatePerBottle: customer.defaultRatePerBottle ?? "",
      openingBalance: customer.openingBalance,
      notes: customer.notes ?? "",
      password: "",
    });
    setEditing(true);
    setMsg(null);
  }

  async function save() {
    if (!form || !form.name.trim() || !form.address.trim()) {
      setMsg({ ok: false, text: "Name and address are required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const body = await api.patch<{ customer: Customer }>(`/admin/customers/${id}`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        houseNo: form.houseNo.trim() || null,
        address: form.address.trim(),
        defaultRatePerBottle: form.defaultRatePerBottle,
        openingBalance: form.openingBalance,
        notes: form.notes.trim() || null,
        password: form.password,
      });
      setSaving(false);
      setCustomer(body.customer);
      setEditing(false);
      api
        .get<{ balance: CustomerBalance }>(`/admin/customers/${id}/balance`)
        .then((d) => setBalance(d.balance))
        .catch(() => {});
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  async function remove() {
    if (!customer) return;
    const ok = await confirm({
      title: `Delete customer "${customer.name}"?`,
      message: "This only works if they have no orders.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/customers/${id}`);
      navigate("/admin/customers");
    } catch (e) {
      await alertDialog(e instanceof ApiError ? e.message : "Could not delete customer.");
    }
  }

  if (notFound) {
    return (
      <AdminShell title="Not found">
        <p className="text-ink-soft">
          This customer doesn&apos;t exist.{" "}
          <Link to="/admin/customers" className="text-accent underline">
            Back to Customers
          </Link>
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={customer?.name ?? "Customer"}>
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Customers
      </Link>

      {customer === null ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <User size={20} />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{customer.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/admin/payments?customerId=${customer.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent transition-colors"
              >
                <Banknote size={15} /> Record payment
              </Link>
              <Link
                to={`/admin/orders/new?customerId=${customer.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors"
              >
                <Plus size={15} /> New order
              </Link>
            </div>
          </div>

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

          {balance && (
            <div className="mt-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-base font-semibold">Summary</h2>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Money</p>
              <div className="mt-1 divide-y divide-line">
                <MoneyRow label="Current outstanding" value={balance.currentOutstanding} />
                <MoneyRow label="Today's sale" value={balance.todaysSale} sign="+" />
                <MoneyRow label="Cash collected" value={balance.cashCollected} sign="−" />
                <MoneyRow label="New outstanding" value={balance.newOutstanding} strong />
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Details</h2>
              {!editing && (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-deep transition-colors"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
            </div>

            {editing && form ? (
              <div className="mt-4">
                <CustomerForm value={form} onChange={setForm} editing />
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-ink-soft transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={remove}
                    className="ml-auto inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} /> Delete customer
                  </button>
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
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2.5 text-sm">
                  <Phone size={15} className="mt-0.5 text-ink-soft/60 shrink-0" />
                  <span>{customer.phone || <span className="text-ink-soft">Not provided</span>}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Home size={15} className="mt-0.5 text-ink-soft/60 shrink-0" />
                  <span>{customer.houseNo || <span className="text-ink-soft">Not provided</span>}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm sm:col-span-2">
                  <MapPin size={15} className="mt-0.5 text-ink-soft/60 shrink-0" />
                  <span>{customer.address}</span>
                </div>
                {customer.notes && (
                  <div className="flex items-start gap-2.5 text-sm sm:col-span-2">
                    <StickyNote size={15} className="mt-0.5 text-ink-soft/60 shrink-0" />
                    <span className="whitespace-pre-wrap text-ink-soft">{customer.notes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

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
              <p className="p-8 text-center text-sm text-ink-soft">No orders from this customer yet.</p>
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
    </AdminShell>
  );
}
