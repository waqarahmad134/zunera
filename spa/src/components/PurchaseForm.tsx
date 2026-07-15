import { Plus, Trash2 } from "lucide-react";
import type { Item } from "@/lib/types/items";
import type { Supplier } from "@/lib/types/suppliers";
import { formatCurrency } from "@/lib/types/orders";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export interface PurchaseLineFormValue {
  itemId: number | "";
  qty: number | "";
  unitCost: number | "";
}

export interface PurchaseFormValue {
  supplierId: number | "";
  receivedDate: string;
  receiptNo: string;
  notes: string;
  lines: PurchaseLineFormValue[];
}

export const EMPTY_PURCHASE_LINE: PurchaseLineFormValue = { itemId: "", qty: "", unitCost: "" };

function lineTotal(line: PurchaseLineFormValue): number {
  const qty = typeof line.qty === "number" ? line.qty : 0;
  const cost = typeof line.unitCost === "number" ? line.unitCost : 0;
  return qty * cost;
}

export default function PurchaseForm({
  value,
  onChange,
  suppliers,
  items,
}: {
  value: PurchaseFormValue;
  onChange: (next: PurchaseFormValue) => void;
  suppliers: Supplier[];
  items: Item[];
}) {
  const totalCost = value.lines.reduce((sum, l) => sum + lineTotal(l), 0);

  function updateLine(index: number, patch: Partial<PurchaseLineFormValue>) {
    const lines = value.lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange({ ...value, lines });
  }

  function removeLine(index: number) {
    onChange({ ...value, lines: value.lines.filter((_, i) => i !== index) });
  }

  function addLine() {
    onChange({ ...value, lines: [...value.lines, { ...EMPTY_PURCHASE_LINE }] });
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Supplier</label>
            <select
              value={value.supplierId}
              onChange={(e) =>
                onChange({ ...value, supplierId: e.target.value ? Number(e.target.value) : "" })
              }
              className={inputClass}
            >
              <option value="">Pick a supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Received on</label>
            <input
              type="date"
              value={value.receivedDate}
              onChange={(e) => onChange({ ...value, receivedDate: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Receipt no</label>
            <input
              type="text"
              value={value.receiptNo}
              onChange={(e) => onChange({ ...value, receiptNo: e.target.value })}
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-ink-soft">
              Auto-suggested as GRN-YYYYMMDD-NNN; override to match your slip.
            </p>
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={value.notes}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              placeholder="e.g. Cash purchase from Akram Hardware"
              rows={2}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold">Items received</p>

        <div className="mt-4 grid gap-3">
          {value.lines.map((line, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto]">
              <div>
                {i === 0 && <label className={labelClass}>Item</label>}
                <select
                  value={line.itemId}
                  onChange={(e) => updateLine(i, { itemId: e.target.value ? Number(e.target.value) : "" })}
                  className={inputClass}
                >
                  <option value="">Pick an item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-28">
                {i === 0 && <label className={labelClass}>Qty</label>}
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={line.qty}
                  onChange={(e) => updateLine(i, { qty: e.target.value === "" ? "" : Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div className="w-full sm:w-32">
                {i === 0 && <label className={labelClass}>Unit cost</label>}
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.unitCost}
                  onChange={(e) =>
                    updateLine(i, { unitCost: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
              <div className="w-full sm:w-28 sm:text-right">
                {i === 0 && <label className={`${labelClass} sm:text-right`}>Line total</label>}
                <p className="py-2.5 text-sm font-medium tabular-nums">{formatCurrency(lineTotal(line))}</p>
              </div>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="justify-self-start p-2 text-ink-soft hover:text-red-600 transition-colors sm:justify-self-center"
                title="Remove line"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addLine}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={14} /> Add line
        </button>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-ink-soft">Total cost</span>
          <span className="text-lg font-semibold tabular-nums">{formatCurrency(totalCost)}</span>
        </div>
      </div>
    </div>
  );
}
