"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, Plus, Search, Trash2 } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { useDialogs } from "@/components/ConfirmProvider";
import type { Customer } from "@/lib/customers";

export default function CustomersPage() {
  const router = useRouter();
  const { confirm, alertDialog } = useDialogs();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    // no-store: runs right after a delete, so it's reflected immediately
    // instead of showing a cached pre-delete response.
    const res = await fetch("/api/admin/customers", { cache: "no-store" });
    if (res.ok) setCustomers((await res.json()).customers);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/customers")
      .then((r) => (r.ok ? r.json() : { customers: [] }))
      .then((d) => {
        if (!cancelled) setCustomers(d.customers);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, search]);

  async function remove(c: Customer, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await confirm({
      title: `Delete customer "${c.name}"?`,
      message: "This only works if they have no orders.",
      confirmText: "Delete",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/customers/${c.id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const body = await res.json().catch(() => ({}));
      await alertDialog(body.error || "Could not delete customer.");
    }
  }

  return (
    <AdminShell title="Customers">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Customers</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Everyone who&apos;s ordered water — searchable when creating an order.
          </p>
        </div>
        <Link
          href="/admin/customers/new"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent-deep transition-colors"
        >
          <Plus size={15} /> Add new
        </Link>
      </div>

      <div className="mt-6 relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone or address"
          className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
        {customers === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">
            {customers.length === 0
              ? "No customers yet. Use “Add new” to create the first one."
              : "No customers match this search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-soft/60">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Phone
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    Address
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/admin/customers/${c.id}`)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-soft/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.name}</td>
                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft max-w-[280px] truncate" title={c.address}>
                      {c.address}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={(e) => remove(c, e)}
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
    </AdminShell>
  );
}
