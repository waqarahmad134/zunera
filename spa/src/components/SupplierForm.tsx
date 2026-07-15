const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export interface SupplierFormValue {
  name: string;
  phone: string;
  address: string;
  openingBalance: number | "";
  notes: string;
}

export default function SupplierForm({
  value,
  onChange,
}: {
  value: SupplierFormValue;
  onChange: (next: SupplierFormValue) => void;
}) {
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
          placeholder="Crystal Plastics Karachi"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <label className={labelClass}>Opening balance (optional)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={value.openingBalance}
            onChange={(e) =>
              onChange({
                ...value,
                openingBalance: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            placeholder="0"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink-soft">Amount already owed to them.</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Address (optional)</label>
        <textarea
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="Street, area, city"
          rows={2}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Anything worth remembering about this supplier..."
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>
    </div>
  );
}
