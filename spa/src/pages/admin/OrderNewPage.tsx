import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import OrderForm, { type OrderFormValue } from "@/components/OrderForm";
import type { Customer } from "@/lib/types/customers";
import { api, ApiError } from "@/lib/api";

const EMPTY: OrderFormValue = {
  customer: null,
  address: "",
  bottles: "",
  ratePerBottle: "",
  status: "pending",
  paymentStatus: "unpaid",
  assignedEmployeeId: null,
  notes: "",
};

export default function OrderNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<OrderFormValue>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Support arriving from a customer's detail page with them pre-selected.
  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (!customerId) return;
    api
      .get<{ customer: Customer }>(`/admin/customers/${customerId}`)
      .then((d) => {
        if (d?.customer) {
          setForm((f) => ({
            ...f,
            customer: d.customer,
            address: d.customer.address,
            ratePerBottle: d.customer.defaultRatePerBottle ?? f.ratePerBottle,
          }));
        }
      })
      .catch(() => {});
  }, [searchParams]);

  async function save() {
    if (!form.customer) {
      setMsg({ ok: false, text: "Select a customer." });
      return;
    }
    if (!form.address.trim()) {
      setMsg({ ok: false, text: "Delivery address is required." });
      return;
    }
    if (!form.bottles || Number(form.bottles) <= 0) {
      setMsg({ ok: false, text: "Enter the number of bottles." });
      return;
    }
    if (!form.ratePerBottle || Number(form.ratePerBottle) <= 0) {
      setMsg({ ok: false, text: "Enter the rate per bottle." });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      await api.post("/admin/orders", {
        customerId: form.customer.id,
        address: form.address.trim(),
        bottles: form.bottles,
        ratePerBottle: form.ratePerBottle,
        status: form.status,
        paymentStatus: form.paymentStatus,
        assignedEmployeeId: form.assignedEmployeeId,
        notes: form.notes.trim() || null,
      });
      navigate("/admin/orders");
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="New order">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Orders
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">New order</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Add an order for a customer requesting water bottles.
      </p>

      <div className="mt-7 max-w-xl rounded-2xl border border-line bg-white p-5 sm:p-7">
        <OrderForm value={form} onChange={setForm} />
      </div>

      <div className="sticky bottom-4 mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save order"}
        </button>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-ink-soft hover:border-accent hover:text-accent transition-colors"
        >
          Cancel
        </Link>
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
    </AdminShell>
  );
}
