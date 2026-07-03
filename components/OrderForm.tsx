"use client";

import CustomerPicker from "@/components/CustomerPicker";
import type { Customer } from "@/lib/customers";
import { STATUSES, STATUS_META, formatCurrency, type OrderStatus } from "@/lib/orders";

export interface OrderFormValue {
  customer: Customer | null;
  address: string;
  bottles: number | "";
  ratePerBottle: number | "";
  status: OrderStatus;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export default function OrderForm({
  value,
  onChange,
}: {
  value: OrderFormValue;
  onChange: (next: OrderFormValue) => void;
}) {
  const bottles = typeof value.bottles === "number" ? value.bottles : 0;
  const rate = typeof value.ratePerBottle === "number" ? value.ratePerBottle : 0;
  const total = bottles * rate;

  return (
    <div className="grid gap-4">
      <div>
        <label className={labelClass}>Customer</label>
        <CustomerPicker
          value={value.customer}
          onSelect={(customer) => onChange({ ...value, customer, address: customer.address })}
        />
      </div>

      <div>
        <label className={labelClass}>Delivery address</label>
        <textarea
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="House 12, Street 4, Sector F-7"
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <p className="mt-1.5 text-xs text-ink-soft/80">
          Filled in from the customer — edit here for a one-off delivery elsewhere.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>No. of bottles</label>
          <input
            type="number"
            min={1}
            step={1}
            value={value.bottles}
            onChange={(e) =>
              onChange({
                ...value,
                bottles: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            placeholder="5"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Rate per bottle</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value.ratePerBottle}
            onChange={(e) =>
              onChange({
                ...value,
                ratePerBottle: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            placeholder="2.50"
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-xl bg-paper-soft px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-ink-soft">Total price</span>
        <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => {
            const active = value.status === s;
            const meta = STATUS_META[s];
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
