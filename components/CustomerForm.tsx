"use client";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export interface CustomerFormValue {
  name: string;
  phone: string;
  address: string;
  password: string;
}

export default function CustomerForm({
  value,
  onChange,
  editing = false,
}: {
  value: CustomerFormValue;
  onChange: (next: CustomerFormValue) => void;
  /** True when editing an existing customer — changes the password hint text. */
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
          placeholder="Jane Doe"
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
      <div>
        <label className={labelClass}>Address</label>
        <textarea
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="House 12, Street 4, Sector F-7"
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>
      <div>
        <label className={labelClass}>Portal password</label>
        <input
          type="password"
          value={value.password}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
          placeholder={editing ? "Leave blank to keep unchanged" : "Leave blank for no portal access"}
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          Lets this customer log in with their phone number to see their own orders. Requires a phone number.
        </p>
      </div>
    </div>
  );
}
