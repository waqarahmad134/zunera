"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check, ChevronRight, Loader2, Plus, Save, Search, Trash2, TriangleAlert,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import Drawer from "@/components/Drawer";
import ItemForm, { type ItemFormValue } from "@/components/ItemForm";
import type { Item } from "@/lib/items";
import { formatCurrency } from "@/lib/orders";

function toFormValue(i: Item): ItemFormValue {
  return {
    name: i.name,
    cost: i.cost,
    margin: i.margin,
    returnable: i.returnable,
    openingStock: i.openingStock,
    notes: i.notes ?? "",
  };
}

export default function ItemsPage() {
  const { confirm } = useDialogs();
  const [items, setItems] = useState<Item[] | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemFormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    // no-store: runs right after a create/update/delete, so the change is
    // reflected immediately instead of showing a cached pre-edit response.
    const res = await fetch("/api/admin/items", { cache: "no-store" });
    if (res.ok) setItems((await res.json()).items);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/items")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (!cancelled) setItems(d.items);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const openItem = openId !== null ? items?.find((i) => i.id === openId) ?? null : null;

  function openDrawer(i: Item) {
    setOpenId(i.id);
    setForm(toFormValue(i));
    setMsg(null);
  }

  function closeDrawer() {
    setOpenId(null);
    setForm(null);
  }

  async function save() {
    if (!openItem || !form) return;
    if (!form.name.trim()) {
      setMsg({ ok: false, text: "Name is required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/items/${openItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          cost: form.cost,
          margin: form.margin,
          returnable: form.returnable,
          openingStock: form.openingStock,
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

  async function remove(i: Item) {
    const ok = await confirm({
      title: `Delete "${i.name}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/items/${i.id}`, { method: "DELETE" });
    if (res.ok) {
      closeDrawer();
      await load();
    }
  }

  return (
    <AdminShell title="Items">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Items</h1>
          <p className="mt-1.5 text-sm text-ink-soft">The stock catalog you buy and deliver.</p>
        </div>
        <Link
          href="/admin/items/new"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors"
        >
          <Plus size={15} /> Add new
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
        {items === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">
            {items.length === 0
              ? "No items yet. Use “Add new” to add the first one."
              : "No items match this search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Cost
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Margin
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Sale price
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Returnable
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Stock
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr
                    key={i.id}
                    onClick={() => openDrawer(i)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-soft/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium max-w-[220px] truncate">{i.name}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(i.cost)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(i.margin)}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(i.salePrice)}</td>
                    <td className="px-4 py-3 text-ink-soft">{i.returnable ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 tabular-nums">{i.openingStock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(i);
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
        open={openItem !== null}
        onClose={closeDrawer}
        title={openItem?.name || ""}
        footer={
          <>
            <button
              onClick={() => openItem && remove(openItem)}
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
        {form && <ItemForm value={form} onChange={setForm} />}
      </Drawer>
    </AdminShell>
  );
}
