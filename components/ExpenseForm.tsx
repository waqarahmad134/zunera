"use client";

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/expenses";

export interface ExpenseFormValue {
  title: string;
  category: ExpenseCategory;
  amount: number | "";
  expenseDate: string;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export default function ExpenseForm({
  value,
  onChange,
}: {
  value: ExpenseFormValue;
  onChange: (next: ExpenseFormValue) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder="Diesel for delivery van"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value as ExpenseCategory })}
            className={inputClass}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Amount</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value.amount}
            onChange={(e) =>
              onChange({ ...value, amount: e.target.value === "" ? "" : Number(e.target.value) })
            }
            placeholder="45.00"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Date</label>
        <input
          type="date"
          value={value.expenseDate}
          onChange={(e) => onChange({ ...value, expenseDate: e.target.value })}
          className={inputClass}
        />
      </div>
    </div>
  );
}
