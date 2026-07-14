"use client";

import { useState } from "react";
import { MapPinned } from "lucide-react";
import AddressMapPicker from "@/components/AddressMapPicker";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export interface CustomerFormValue {
  name: string;
  phone: string;
  houseNo: string;
  address: string;
  defaultRatePerBottle: number | "";
  openingBalance: number | "";
  notes: string;
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
  const [pickerOpen, setPickerOpen] = useState(false);

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
        <label className={labelClass}>House / unit no. (optional)</label>
        <input
          type="text"
          value={value.houseNo}
          onChange={(e) => onChange({ ...value, houseNo: e.target.value })}
          placeholder="12-B"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          A separate house, flat or unit number — can be any value, kept apart from the full address below.
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass}>Address</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-deep transition-colors"
          >
            <MapPinned size={13} /> Pick on map
          </button>
        </div>
        <textarea
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="House 12, Street 4, Sector F-7"
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
        <AddressMapPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(address) => onChange({ ...value, address })}
        />
      </div>
      <div>
        <label className={labelClass}>Default rate per bottle (optional)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={value.defaultRatePerBottle}
          onChange={(e) =>
            onChange({
              ...value,
              defaultRatePerBottle: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
          placeholder="2.50"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-ink-soft">
          Prefills the rate on any new order for them — still editable per order.
        </p>
      </div>
      <div className="border-t border-line pt-4">
        <p className="mb-3 text-xs font-semibold tracking-wide uppercase text-ink-soft">
          Opening values <span className="normal-case font-normal text-ink-soft/70">(optional)</span>
        </p>
        <label className={labelClass}>Opening balance (Rs)</label>
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
        <p className="mt-1.5 text-xs text-ink-soft">Amount they already owe you.</p>
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
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={value.notes}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          placeholder="Anything worth remembering about this customer..."
          rows={3}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>
    </div>
  );
}
