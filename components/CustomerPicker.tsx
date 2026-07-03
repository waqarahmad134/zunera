"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Search, TriangleAlert, User, X } from "lucide-react";
import type { Customer } from "@/lib/customers";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";

function NewCustomerForm({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName: string;
  onCreated: (c: Customer) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim() || !address.trim()) {
      setError("Name and address are required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), address: address.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) onCreated(body.customer);
    else setError(body.error || "Could not create customer.");
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-3.5">
      <p className="text-xs font-semibold text-accent-deep">New customer</p>
      <div className="mt-2.5 grid gap-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name"
          autoFocus
          className={inputClass}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          className={inputClass}
        />
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Delivery address"
          rows={2}
          className={`${inputClass} resize-y`}
        />
        {error && (
          <p className="inline-flex items-center gap-1.5 text-xs text-red-600">
            <TriangleAlert size={13} /> {error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent text-white px-3 py-1.5 text-xs font-medium hover:bg-accent-deep transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save customer
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-ink-soft hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPicker({
  value,
  onSelect,
}: {
  value: Customer | null;
  onSelect: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[] | null>(null);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      fetch(`/api/admin/customers?search=${encodeURIComponent(query)}`)
        .then((r) => (r.ok ? r.json() : { customers: [] }))
        .then((d) => {
          if (!cancelled) setResults(d.customers);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (value && !open) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5">
        <span className="mt-0.5 rounded-full bg-accent-soft p-1.5 text-accent shrink-0">
          <User size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{value.name}</p>
          <p className="text-xs text-ink-soft truncate">
            {value.phone ? `${value.phone} · ` : ""}
            {value.address}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setQuery("");
          }}
          className="shrink-0 text-xs font-medium text-accent hover:text-accent-deep transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search customers by name, phone or address..."
          className={`${inputClass} pl-9`}
        />
        {value && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-line bg-white p-2 shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
          {creating ? (
            <NewCustomerForm
              initialName={query}
              onCreated={(c) => {
                onSelect(c);
                setOpen(false);
                setCreating(false);
              }}
              onCancel={() => setCreating(false)}
            />
          ) : (
            <>
              <div className="max-h-56 overflow-y-auto">
                {results === null ? (
                  <div className="flex items-center gap-2 p-3 text-xs text-ink-soft">
                    <Loader2 size={13} className="animate-spin" /> Searching...
                  </div>
                ) : results.length === 0 ? (
                  <p className="p-3 text-xs text-ink-soft">No customers found.</p>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelect(c);
                        setOpen(false);
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-paper-soft transition-colors"
                    >
                      <span className="mt-0.5 rounded-full bg-accent-soft p-1.5 text-accent shrink-0">
                        <User size={13} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">{c.name}</span>
                        <span className="block text-xs text-ink-soft truncate">
                          {c.phone ? `${c.phone} · ` : ""}
                          {c.address}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-line p-2 pt-2.5 text-left text-sm font-medium text-accent hover:text-accent-deep transition-colors"
              >
                <Plus size={15} /> Add new customer{query ? ` "${query}"` : ""}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
