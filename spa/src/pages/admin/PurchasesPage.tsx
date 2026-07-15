import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2, Plus, Search, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import Drawer from "@/components/Drawer";
import type { Purchase } from "@/lib/types/purchases";
import { formatCurrency, formatDate } from "@/lib/types/orders";
import { api } from "@/lib/api";

export default function PurchasesPage() {
  const { confirm } = useDialogs();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const d = await api.get<{ purchases: Purchase[] }>("/admin/purchases");
    setPurchases(d.purchases);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ purchases: Purchase[] }>("/admin/purchases")
      .then((d) => {
        if (!cancelled) setPurchases(d.purchases);
      })
      .catch(() => {
        if (!cancelled) setPurchases([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!purchases) return [];
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p) =>
        p.supplierName.toLowerCase().includes(q) ||
        (p.receiptNo ?? "").toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const openPurchase = openId !== null ? purchases?.find((p) => p.id === openId) ?? null : null;

  async function remove(p: Purchase) {
    const ok = await confirm({
      title: `Delete this purchase from "${p.supplierName}"?`,
      message: "This cannot be undone.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/purchases/${p.id}`);
      setOpenId(null);
      await load();
    } catch {
      // no-op — deletion failure surfaces via the record remaining in the list.
    }
  }

  return (
    <AdminShell title="Purchases">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Purchases</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Stock received from your suppliers.</p>
        </div>
        <Link
          to="/admin/purchases/new"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors"
        >
          <Plus size={15} /> Record purchase
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search supplier or receipt no"
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
        {purchases === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">
            {purchases.length === 0
              ? "No purchases yet. Use “Record purchase” to log the first one."
              : "No purchases match this search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Supplier
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Receipt no
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Received
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Total cost
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setOpenId(p.id)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-soft/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.supplierName}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{p.receiptNo || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(p.receivedDate)}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(p.totalCost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(p);
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
        open={openPurchase !== null}
        onClose={() => setOpenId(null)}
        title={openPurchase?.supplierName || ""}
        subtitle={
          openPurchase
            ? `${openPurchase.receiptNo || `Purchase #${openPurchase.id}`} · ${formatDate(openPurchase.receivedDate)}`
            : undefined
        }
        footer={
          <button
            onClick={() => openPurchase && remove(openPurchase)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-red-300 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} /> Delete
          </button>
        }
      >
        {openPurchase && (
          <div className="grid gap-4">
            {openPurchase.notes && (
              <p className="rounded-xl bg-paper-soft px-4 py-3 text-sm text-ink-soft whitespace-pre-wrap">
                {openPurchase.notes}
              </p>
            )}
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-paper-soft/60">
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                      Item
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                      Unit cost
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {openPurchase.lines.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2.5">{l.itemName}</td>
                      <td className="px-3 py-2.5 tabular-nums">{l.qty}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatCurrency(l.unitCost)}</td>
                      <td className="px-3 py-2.5 tabular-nums font-medium">{formatCurrency(l.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-paper-soft px-4 py-3">
              <span className="text-sm text-ink-soft">Total cost</span>
              <span className="text-lg font-semibold tabular-nums">{formatCurrency(openPurchase.totalCost)}</span>
            </div>
          </div>
        )}
      </Drawer>
    </AdminShell>
  );
}
