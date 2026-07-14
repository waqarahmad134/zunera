"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Save, TriangleAlert } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import ExpenseForm, { type ExpenseFormValue } from "@/components/ExpenseForm";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY: ExpenseFormValue = { title: "", category: "fuel", amount: "", expenseDate: today(), notes: "" };

export default function NewExpensePage() {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseFormValue>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    if (!form.title.trim()) {
      setMsg({ ok: false, text: "Title is required." });
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setMsg({ ok: false, text: "Enter an amount." });
      return;
    }
    if (!form.expenseDate) {
      setMsg({ ok: false, text: "Pick a date." });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          amount: form.amount,
          expenseDate: form.expenseDate,
          notes: form.notes.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaving(false);
        setMsg({ ok: false, text: body.error || "Save failed." });
        return;
      }
      router.push("/admin/expenses");
      router.refresh();
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
  }

  return (
    <AdminShell title="New expense">
      <Link
        href="/admin/expenses"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
      >
        <ArrowLeft size={15} /> Back to Expenses
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">New expense</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Log a business cost.</p>

      <div className="mt-7 max-w-xl rounded-2xl border border-line bg-white p-5 sm:p-7">
        <ExpenseForm value={form} onChange={setForm} />
      </div>

      <div className="sticky bottom-4 mt-6 flex max-w-xl items-center gap-3 rounded-2xl border border-line bg-white/95 backdrop-blur p-3 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-5 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving..." : "Save expense"}
        </button>
        <Link
          href="/admin/expenses"
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
