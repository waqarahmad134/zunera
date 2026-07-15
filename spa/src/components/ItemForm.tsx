const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export interface ItemFormValue {
  name: string;
  cost: number | "";
  margin: number | "";
  returnable: boolean;
  openingStock: number | "";
  notes: string;
}

export default function ItemForm({
  value,
  onChange,
}: {
  value: ItemFormValue;
  onChange: (next: ItemFormValue) => void;
}) {
  const cost = typeof value.cost === "number" ? value.cost : 0;
  const margin = typeof value.margin === "number" ? value.margin : 0;
  const salePrice = cost + margin;

  return (
    // grid-cols-1, not bare `grid`: Tailwind's grid-cols-N utilities use
    // minmax(0, 1fr) tracks, avoiding the "auto" implicit-column blowout
    // that lets unbreakable content grow the page wider than the viewport.
    <div className="grid grid-cols-1 gap-4">
      <div>
        <label className={labelClass}>Name</label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          placeholder="19 Litre Refill"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cost</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value.cost}
            onChange={(e) =>
              onChange({ ...value, cost: e.target.value === "" ? "" : Number(e.target.value) })
            }
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Margin</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value.margin}
            onChange={(e) =>
              onChange({ ...value, margin: e.target.value === "" ? "" : Number(e.target.value) })
            }
            placeholder="0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="rounded-xl bg-paper-soft px-4 py-3">
        <p className="text-xs text-ink-soft">Default sale price</p>
        <p className="mt-0.5 text-lg font-semibold tabular-nums">Rs {salePrice.toFixed(2)}</p>
        <p className="mt-1 text-xs text-ink-soft">Cost + margin — used as the default rate wherever this item is sold.</p>
      </div>

      <div className="rounded-xl border border-line px-4 py-3">
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={value.returnable}
            onChange={(e) => onChange({ ...value, returnable: e.target.checked })}
            className="mt-0.5 size-4 accent-accent"
          />
          <span>
            <span className="font-medium">Returnable</span>
            <p className="mt-0.5 text-xs text-ink-soft">
              Riders must collect an empty back from customers (e.g. 19L refills).
            </p>
          </span>
        </label>
      </div>

      <div>
        <label className={labelClass}>Opening stock</label>
        <input
          type="number"
          min={0}
          step={1}
          value={value.openingStock}
          onChange={(e) =>
            onChange({ ...value, openingStock: e.target.value === "" ? "" : Number(e.target.value) })
          }
          placeholder="0"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Anything worth remembering about this item..."
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>
    </div>
  );
}
