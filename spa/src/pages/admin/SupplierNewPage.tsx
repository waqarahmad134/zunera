import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import SupplierForm, { type SupplierFormValue } from "@/components/SupplierForm";
import { api, ApiError } from "@/lib/api";

const EMPTY: SupplierFormValue = { name: "", phone: "", address: "", openingBalance: "", notes: "" };

export default function SupplierNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<SupplierFormValue>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (!form.name.trim()) {
      setMsg({ ok: false, text: "Name is required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/admin/suppliers", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        openingBalance: form.openingBalance,
        notes: form.notes.trim() || null,
      });
      navigate("/admin/suppliers");
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="New supplier">
      <Link
        to="/admin/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Suppliers
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">New supplier</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Add a vendor you buy from. Opening balance is optional — leave at 0 if you don&apos;t owe anything yet.
      </p>

      <div className="mt-7 max-w-xl rounded-2xl border border-line bg-white p-5 sm:p-7">
        <SupplierForm value={form} onChange={setForm} />
      </div>

      <div className="sticky bottom-4 mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save supplier"}
        </button>
        <Link
          to="/admin/suppliers"
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
