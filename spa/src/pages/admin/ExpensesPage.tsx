import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check, ChevronRight, Loader2, Plus, Save, Search, Trash2, TriangleAlert,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import Drawer from "@/components/Drawer";
import ExpenseForm, { type ExpenseFormValue } from "@/components/ExpenseForm";
import {
  EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type Expense, type ExpenseCategory,
} from "@/lib/types/expenses";
import { formatCurrency, formatDate } from "@/lib/types/orders";
import { api, ApiError } from "@/lib/api";

type Tab = "all" | ExpenseCategory;

function toFormValue(e: Expense): ExpenseFormValue {
  return {
    title: e.title,
    category: e.category,
    amount: e.amount,
    expenseDate: e.expenseDate,
    notes: e.notes ?? "",
  };
}

export default function ExpensesPage() {
  const { confirm } = useDialogs();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseFormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const d = await api.get<{ expenses: Expense[] }>("/admin/expenses");
    setExpenses(d.expenses);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ expenses: Expense[] }>("/admin/expenses")
      .then((d) => {
        if (!cancelled) setExpenses(d.expenses);
      })
      .catch(() => {
        if (!cancelled) setExpenses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!expenses) return [];
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (tab !== "all" && e.category !== tab) return false;
      if (q && !e.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [expenses, tab, search]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      all: expenses?.length ?? 0,
      fuel: 0,
      stock: 0,
      salaries: 0,
      maintenance: 0,
      other: 0,
    };
    for (const e of expenses ?? []) c[e.category]++;
    return c;
  }, [expenses]);

  const openExpense = openId !== null ? expenses?.find((e) => e.id === openId) ?? null : null;

  function openDrawer(e: Expense) {
    setOpenId(e.id);
    setForm(toFormValue(e));
    setMsg(null);
  }

  function closeDrawer() {
    setOpenId(null);
    setForm(null);
  }

  async function save() {
    if (!openExpense || !form) return;
    if (!form.title.trim()) {
      setMsg({ ok: false, text: "Title is required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.patch(`/admin/expenses/${openExpense.id}`, {
        title: form.title.trim(),
        category: form.category,
        amount: form.amount,
        expenseDate: form.expenseDate,
        notes: form.notes.trim() || null,
      });
      setSaving(false);
      await load();
      setMsg({ ok: true, text: "Saved." });
    } catch (e) {
      setSaving(false);
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Save failed." });
    }
  }

  async function remove(e: Expense) {
    const ok = await confirm({
      title: `Delete "${e.title}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/expenses/${e.id}`);
      closeDrawer();
      await load();
    } catch {
      // no-op — deletion failure surfaces via the record remaining in the list.
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    ...EXPENSE_CATEGORIES.map((c) => ({ id: c as Tab, label: EXPENSE_CATEGORY_LABELS[c] })),
  ];

  return (
    <AdminShell title="Expenses">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Expenses</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Business costs — fuel, stock, salaries and more.</p>
        </div>
        <Link
          to="/admin/expenses/new"
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
            placeholder="Search title"
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
        {expenses === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">
            {expenses.length === 0
              ? "No expenses yet. Use “Add new” to log the first one."
              : "No expenses match this filter."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Title
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Category
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Amount
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.id}
                    onClick={() => openDrawer(e)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-soft/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium max-w-[260px] truncate">{e.title}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-line bg-paper-soft px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                        {EXPENSE_CATEGORY_LABELS[e.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(e.expenseDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            remove(e);
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
        open={openExpense !== null}
        onClose={closeDrawer}
        title={openExpense?.title || ""}
        subtitle={openExpense ? `Expense #${openExpense.id}` : undefined}
        footer={
          <>
            <button
              onClick={() => openExpense && remove(openExpense)}
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
        {form && <ExpenseForm value={form} onChange={setForm} />}
      </Drawer>
    </AdminShell>
  );
}
