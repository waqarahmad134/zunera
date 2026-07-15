import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import CustomerForm, { type CustomerFormValue } from "@/components/CustomerForm";
import { api, ApiError } from "@/lib/api";
import type { Customer } from "@/lib/types/customers";

const EMPTY: CustomerFormValue = {
  name: "",
  phone: "",
  houseNo: "",
  address: "",
  defaultRatePerBottle: "",
  openingBalance: "",
  notes: "",
  password: "",
};

export default function CustomerNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CustomerFormValue>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (!form.name.trim() || !form.address.trim()) {
      setMsg({ ok: false, text: "Name and address are required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const body = await api.post<{ customer: Customer }>("/admin/customers", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        houseNo: form.houseNo.trim() || null,
        address: form.address.trim(),
        defaultRatePerBottle: form.defaultRatePerBottle,
        openingBalance: form.openingBalance,
        notes: form.notes.trim() || null,
        password: form.password,
      });
      navigate(`/admin/customers/${body.customer.id}`);
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="New customer">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Customers
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">New customer</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Save their details so you can select them on future orders.</p>

      <div className="mt-7 max-w-xl rounded-2xl border border-line bg-white p-5 sm:p-7">
        <CustomerForm value={form} onChange={setForm} editing={false} />
      </div>

      <div className="sticky bottom-4 mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save customer"}
        </button>
        <Link
          to="/admin/customers"
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
