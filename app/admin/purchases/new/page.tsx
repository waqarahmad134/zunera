"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Save, Truck, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import PurchaseForm, {
  EMPTY_PURCHASE_LINE, type PurchaseFormValue,
} from "@/components/PurchaseForm";
import type { Item } from "@/lib/items";
import type { Supplier } from "@/lib/suppliers";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY: PurchaseFormValue = {
  supplierId: "",
  receivedDate: today(),
  receiptNo: "",
  notes: "",
  lines: [{ ...EMPTY_PURCHASE_LINE }],
};

export default function NewPurchasePage() {
  const router = useRouter();
  const [form, setForm] = useState<PurchaseFormValue>(EMPTY);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/suppliers")
      .then((r) => (r.ok ? r.json() : { suppliers: [] }))
      .then((d) => {
        if (!cancelled) setSuppliers(d.suppliers);
      });
    fetch("/api/admin/items")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!cancelled) setItems(d.items);
      });
    fetch("/api/admin/purchases/next-receipt-no")
      .then((r) => (r.ok ? r.json() : { receiptNo: "" }))
      .then((d) => {
        if (!cancelled && d.receiptNo) setForm((f) => ({ ...f, receiptNo: d.receiptNo }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!form.supplierId) {
      setMsg({ ok: false, text: "Select a supplier." });
      return;
    }
    if (!form.receivedDate) {
      setMsg({ ok: false, text: "Pick a received date." });
      return;
    }
    const lines = form.lines.filter((l) => l.itemId !== "" || l.qty !== "" || l.unitCost !== "");
    if (lines.length === 0) {
      setMsg({ ok: false, text: "Add at least one item line." });
      return;
    }
    for (const l of lines) {
      if (!l.itemId) {
        setMsg({ ok: false, text: "Every line needs an item selected." });
        return;
      }
      if (!l.qty || Number(l.qty) <= 0) {
        setMsg({ ok: false, text: "Every line needs a quantity greater than zero." });
        return;
      }
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: form.supplierId,
          receivedDate: form.receivedDate,
          receiptNo: form.receiptNo.trim() || null,
          notes: form.notes.trim() || null,
          lines: lines.map((l) => ({ itemId: l.itemId, qty: l.qty, unitCost: l.unitCost || 0 })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        setMsg({ ok: false, text: body.error || "Save failed." });
        return;
      }
      router.push("/admin/purchases");
      router.refresh();
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="Record purchase">
      <Link
        href="/admin/purchases"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Purchases
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Truck size={20} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Record purchase</h1>
          <p className="mt-1 text-sm text-ink-soft">Use this when goods arrived without a Purchase Order on file.</p>
        </div>
      </div>

      <div className="mt-7">
        <PurchaseForm value={form} onChange={setForm} suppliers={suppliers} items={items} />
      </div>

      <div className="sticky bottom-4 mt-6 flex items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save purchase"}
        </button>
        <Link
          href="/admin/purchases"
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
