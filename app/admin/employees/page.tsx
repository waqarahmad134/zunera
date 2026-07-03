"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check, ChevronRight, Loader2, Plus, Save, Search, Trash2, TriangleAlert,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import Drawer from "@/components/Drawer";
import EmployeeForm, { type EmployeeFormValue } from "@/components/EmployeeForm";
import {
  EMPLOYEE_STATUS_META, type Employee, type EmployeeStatus,
} from "@/lib/employees";
import { formatCurrency, formatDate } from "@/lib/orders";

type Tab = "all" | EmployeeStatus;

function toFormValue(e: Employee): EmployeeFormValue {
  return {
    name: e.name,
    phone: e.phone ?? "",
    role: e.role,
    salary: e.salary,
    joinedDate: e.joinedDate,
    status: e.status,
  };
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeFormValue | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/employees");
    if (res.ok) setEmployees((await res.json()).employees);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/employees")
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((d) => {
        if (!cancelled) setEmployees(d.employees);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!employees) return [];
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (tab !== "all" && e.status !== tab) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.role.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [employees, tab, search]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: employees?.length ?? 0, active: 0, inactive: 0 };
    for (const e of employees ?? []) c[e.status]++;
    return c;
  }, [employees]);

  const openEmployee = openId !== null ? employees?.find((e) => e.id === openId) ?? null : null;

  function openDrawer(e: Employee) {
    setOpenId(e.id);
    setForm(toFormValue(e));
    setMsg(null);
  }

  function closeDrawer() {
    setOpenId(null);
    setForm(null);
  }

  async function save() {
    if (!openEmployee || !form) return;
    if (!form.name.trim() || !form.role.trim()) {
      setMsg({ ok: false, text: "Name and role are required." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/employees/${openEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role.trim(),
          salary: form.salary,
          joinedDate: form.joinedDate,
          status: form.status,
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

  async function remove(e: Employee) {
    if (!confirm(`Remove “${e.name}” from employees? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/employees/${e.id}`, { method: "DELETE" });
    if (res.ok) {
      closeDrawer();
      await load();
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  return (
    <AdminShell title="Employees">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Employees</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Drivers and staff working at Jubilee Water.</p>
        </div>
        <Link
          href="/admin/employees/new"
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
            placeholder="Search name or role"
            className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line bg-white overflow-hidden">
        {employees === null ? (
          <div className="flex items-center gap-2 p-10 text-sm text-ink-soft">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-ink-soft">
            {employees.length === 0
              ? "No employees yet. Use “Add new” to add the first one."
              : "No employees match this filter."}
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
                    Role
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Phone
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Salary
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Joined
                  </th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const meta = EMPLOYEE_STATUS_META[e.status];
                  return (
                    <tr
                      key={e.id}
                      onClick={() => openDrawer(e)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-paper-soft/60 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium max-w-[180px] truncate">{e.name}</td>
                      <td className="px-4 py-3 text-ink-soft max-w-[180px] truncate">{e.role}</td>
                      <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{e.phone || "—"}</td>
                      <td className="px-4 py-3 tabular-nums font-medium">{formatCurrency(e.salary)}</td>
                      <td className="px-4 py-3 text-ink-soft whitespace-nowrap">{formatDate(e.joinedDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      </td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={openEmployee !== null}
        onClose={closeDrawer}
        title={openEmployee?.name || ""}
        subtitle={openEmployee?.role}
        footer={
          <>
            <button
              onClick={() => openEmployee && remove(openEmployee)}
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
        {form && <EmployeeForm value={form} onChange={setForm} />}
      </Drawer>
    </AdminShell>
  );
}
