import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Loader2, Save, Search, Trash2, TriangleAlert, User, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import type { Customer } from "@/lib/types/customers";
import { formatCurrency, formatDate } from "@/lib/types/orders";
import { PAYMENT_METHODS, PAYMENT_METHOD_META, type PaymentIn, type PaymentMethod } from "@/lib/types/payments";
import { api, ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormValue {
  customer: Customer | null;
  amount: number | "";
  date: string;
  method: PaymentMethod;
  note: string;
}

const EMPTY: FormValue = { customer: null, amount: "", date: today(), method: "cash", note: "" };

/**
 * Lightweight inline customer search-and-select — a simplified stand-in for
 * the full `CustomerPicker` component (not yet ported), scoped down to just
 * search + select since that's all Payment In needs.
 */
function InlineCustomerPicker({
  value,
  onSelect,
}: {
  value: Customer | null;
  onSelect: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      api
        .get<{ customers: Customer[] }>(`/admin/customers?search=${encodeURIComponent(query)}`)
        .then((d) => {
          if (!cancelled) setResults(d.customers);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (value && !open) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5">
        <span className="mt-0.5 rounded-full bg-accent-soft p-1.5 text-accent shrink-0">
          <User size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{value.name}</p>
          <p className="text-xs text-ink-soft truncate">
            {value.phone ? `${value.phone} · ` : ""}
            {value.address}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setQuery("");
          }}
          className="shrink-0 text-xs font-medium text-accent hover:text-accent-deep transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search customers by name, phone or address..."
          className={`${inputClass} pl-9`}
        />
        {value && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-line bg-white p-2 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
          <div className="max-h-56 overflow-y-auto">
            {results === null ? (
              <div className="flex items-center gap-2 p-3 text-xs text-ink-soft">
                <Loader2 size={13} className="animate-spin" /> Searching...
              </div>
            ) : results.length === 0 ? (
              <p className="p-3 text-xs text-ink-soft">No customers found.</p>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-paper-soft transition-colors"
                >
                  <span className="mt-0.5 rounded-full bg-accent-soft p-1.5 text-accent shrink-0">
                    <User size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{c.name}</span>
                    <span className="block text-xs text-ink-soft truncate">
                      {c.phone ? `${c.phone} · ` : ""}
                      {c.address}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const { confirm } = useDialogs();

  const [form, setForm] = useState<FormValue>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [payments, setPayments] = useState<PaymentIn[] | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Support arriving from a customer's detail page with them pre-selected.
  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (!customerId) return;
    api
      .get<{ customer: Customer }>(`/admin/customers/${customerId}`)
      .then((d) => {
        if (d?.customer) setForm((f) => ({ ...f, customer: d.customer }));
      })
      .catch(() => {
        // no-op — form just starts with no customer pre-selected.
      });
  }, [searchParams]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const d = await api.get<{ payments: PaymentIn[] }>(`/admin/payments?${params}`);
    setPayments(d.payments);
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    api
      .get<{ payments: PaymentIn[] }>(`/admin/payments?${params}`)
      .then((d) => {
        if (!cancelled) setPayments(d.payments);
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  function clearForm() {
    setForm(EMPTY);
    setMsg(null);
  }

  async function save() {
    if (!form.customer) {
      setMsg({ ok: false, text: "Select a customer." });
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setMsg({ ok: false, text: "Enter an amount." });
      return;
    }
    if (!form.date) {
      setMsg({ ok: false, text: "Pick a date." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/admin/payments", {
        customerId: form.customer.id,
        amount: form.amount,
        paymentDate: form.date,
        method: form.method,
        note: form.note.trim() || null,
      });
      setSaving(false);
      setForm(EMPTY);
      setMsg({ ok: true, text: "Payment saved." });
      await load();
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  async function remove(p: PaymentIn) {
    const ok = await confirm({
      title: `Delete this Rs ${p.amount} payment from "${p.customerName}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/payments/${p.id}`);
      await load();
    } catch {
      // no-op — deletion failure surfaces via the record remaining in the list.
    }
  }

  return (
    <AdminShell title="Payment In">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Main</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Payment In</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Record a payment received from a customer that isn&apos;t tied to a delivery (e.g. bank transfer, follow-up
        cash).
      </p>

      <div className="mt-6 max-w-2xl rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>Customer</label>
            <InlineCustomerPicker value={form.customer} onSelect={(customer) => setForm({ ...form, customer })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Amount (Rs)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value === "" ? "" : Number(e.target.value) })}
                placeholder="5000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Method</label>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => {
                const meta = PAYMENT_METHOD_META[m];
                const active = form.method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, method: m })}
                    className={`rounded-xl border p-3.5 text-left transition-colors ${
                      active ? "border-accent bg-accent-soft" : "border-line hover:border-ink-soft"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span
                        className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${
                          active ? "border-accent" : "border-line"
                        }`}
                      >
                        {active && <span className="size-2 rounded-full bg-accent" />}
                      </span>
                      {meta.label}
                    </span>
                    <span className="mt-0.5 block pl-6 text-xs text-ink-soft">{meta.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Note (optional)</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="e.g. JazzCash ref 9812"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={clearForm}
            className="rounded-xl border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-ink-soft transition-colors"
          >
            Clear form
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save payment"}
          </button>
          {msg && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}
            >
              {msg.ok ? <Check size={14} /> : <TriangleAlert size={14} />}
              {msg.text}
            </span>
          )}
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-line bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-base font-semibold">Payment records</h2>
          <div className="flex items-center gap-2">
            <div>
              <label className="mr-1.5 text-xs text-ink-soft">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="mr-1.5 text-xs text-ink-soft">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </div>
        {payments === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : payments.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Customer
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Method
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Note
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">{p.customerName}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-ink-soft">{PAYMENT_METHOD_META[p.method].label}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 text-ink-soft max-w-[220px] truncate">{p.note || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove(p)}
                        title="Delete"
                        className="p-1.5 text-ink-soft hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
