"use client";

import { EMPLOYEE_STATUSES, EMPLOYEE_STATUS_META, type EmployeeStatus } from "@/lib/employees";

export interface EmployeeFormValue {
  name: string;
  phone: string;
  role: string;
  salary: number | "";
  joinedDate: string;
  status: EmployeeStatus;
  password: string;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export default function EmployeeForm({
  value,
  onChange,
  editing = false,
}: {
  value: EmployeeFormValue;
  onChange: (next: EmployeeFormValue) => void;
  /** True when editing an existing employee — changes the password hint text. */
  editing?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="Ahmed Khan"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Role</label>
          <input
            type="text"
            value={value.role}
            onChange={(e) => onChange({ ...value, role: e.target.value })}
            placeholder="Delivery Driver"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Phone (optional)</label>
          <input
            type="text"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="+92 300 1234567"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Salary (monthly)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value.salary}
            onChange={(e) =>
              onChange({ ...value, salary: e.target.value === "" ? "" : Number(e.target.value) })
            }
            placeholder="35000"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Joined</label>
          <input
            type="date"
            value={value.joinedDate}
            onChange={(e) => onChange({ ...value, joinedDate: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Staff login password</label>
        <input
          type="password"
          value={value.password}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
          placeholder={editing ? "Leave blank to keep unchanged" : "Leave blank for no staff login"}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          Lets this employee log in with their phone number to view and update orders. Requires a phone number.
        </p>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <div className="flex flex-wrap gap-2">
          {EMPLOYEE_STATUSES.map((s) => {
            const active = value.status === s;
            const meta = EMPLOYEE_STATUS_META[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...value, status: s })}
                style={
                  active
                    ? { background: meta.bg, borderColor: meta.color, color: meta.color }
                    : undefined
                }
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? "" : "border-line text-ink-soft hover:border-ink-soft"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
