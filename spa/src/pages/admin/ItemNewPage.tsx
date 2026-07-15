import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import ItemForm, { type ItemFormValue } from "@/components/ItemForm";
import { api, ApiError } from "@/lib/api";

const EMPTY: ItemFormValue = { name: "", cost: "", margin: "", returnable: false, openingStock: "", notes: "" };

export default function ItemNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ItemFormValue>(EMPTY);
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
      await api.post("/admin/items", {
        name: form.name.trim(),
        cost: form.cost,
        margin: form.margin,
        returnable: form.returnable,
        openingStock: form.openingStock,
        notes: form.notes.trim() || null,
      });
      navigate("/admin/items");
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="New item">
      <Link
        to="/admin/items"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Items
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">New item</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Add a stock item you buy and deliver.</p>

      <div className="mt-7 max-w-xl rounded-2xl border border-line bg-white p-5 sm:p-7">
        <ItemForm value={form} onChange={setForm} />
      </div>

      <div className="sticky bottom-4 mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save item"}
        </button>
        <Link
          to="/admin/items"
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
