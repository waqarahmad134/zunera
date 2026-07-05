"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import CustomerPicker from "@/components/CustomerPicker";
import type { Customer } from "@/lib/customers";
import type { Employee } from "@/lib/employees";
import type { EmployeeLocation } from "@/lib/locations";
import { formatDistance, haversineKm } from "@/lib/geo";
import {
  PAYMENT_STATUSES, PAYMENT_STATUS_META, STATUSES, STATUS_META,
  formatCurrency, type OrderStatus, type PaymentStatus,
} from "@/lib/orders";

export interface OrderFormValue {
  customer: Customer | null;
  address: string;
  bottles: number | "";
  ratePerBottle: number | "";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  assignedEmployeeId: number | null;
}

const inputClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-semibold tracking-wide uppercase text-ink-soft mb-1.5";

export default function OrderForm({
  value,
  onChange,
  statusLockedByEmployee = false,
  paymentLockedByEmployee = false,
}: {
  value: OrderFormValue;
  onChange: (next: OrderFormValue) => void;
  /** Informational only — admin is never blocked, unlike the staff app. */
  statusLockedByEmployee?: boolean;
  paymentLockedByEmployee?: boolean;
}) {
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [locations, setLocations] = useState<EmployeeLocation[] | null>(null);
  const [orderLocation, setOrderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/employees?status=active")
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((d) => {
        if (!cancelled) setEmployees(d.employees);
      });
    fetch("/api/admin/locations")
      .then((r) => (r.ok ? r.json() : { locations: [] }))
      .then((d) => {
        if (!cancelled) setLocations(d.locations);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Geocode the delivery address (debounced) so we can rank employees by
  // distance to it — free via OpenStreetMap's Nominatim, same provider as
  // the live map's tiles.
  useEffect(() => {
    const address = value.address.trim();
    if (address.length < 6) {
      Promise.resolve().then(() => {
        setOrderLocation(null);
        setGeocodeFailed(false);
      });
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      setGeocoding(true);
      setGeocodeFailed(false);
      fetch(`/api/admin/geocode?q=${encodeURIComponent(address)}`)
        .then((r) => (r.ok ? r.json() : { location: null }))
        .then((d) => {
          if (cancelled) return;
          setOrderLocation(d.location);
          setGeocodeFailed(!d.location);
        })
        .catch(() => {
          if (!cancelled) setGeocodeFailed(true);
        })
        .finally(() => {
          if (!cancelled) setGeocoding(false);
        });
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [value.address]);

  const nearest = useMemo(() => {
    if (!orderLocation || !employees || !locations) return [];
    const byId = new Map(locations.map((l) => [l.employeeId, l]));
    return employees
      .map((emp) => {
        const loc = byId.get(emp.id);
        if (!loc) return null;
        const km = haversineKm(orderLocation.lat, orderLocation.lng, loc.lat, loc.lng);
        return { employee: emp, km };
      })
      .filter((v): v is { employee: Employee; km: number } => v !== null)
      .sort((a, b) => a.km - b.km)
      .slice(0, 3);
  }, [orderLocation, employees, locations]);

  const bottles = typeof value.bottles === "number" ? value.bottles : 0;
  const rate = typeof value.ratePerBottle === "number" ? value.ratePerBottle : 0;
  const total = bottles * rate;

  return (
    // grid-cols-1 (not just `grid`) is required here, not cosmetic: Tailwind's
    // grid-cols-N utilities use `minmax(0, 1fr)` tracks, whereas a bare
    // `grid` container falls back to an `auto`-sized implicit column that
    // grows to fit a child's min-content width. The CustomerPicker chip's
    // nowrap phone/address text has no wrap point, so without this its
    // min-content size blows out the whole column (and the page) past the
    // viewport on mobile instead of truncating.
    <div className="grid grid-cols-1 gap-4">
      <div className="min-w-0">
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

      {(geocoding || nearest.length > 0 || geocodeFailed) && (
        <div className="rounded-xl border border-line bg-paper-soft px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <Navigation size={13} /> Nearest employees
          </p>
          {geocoding ? (
            <p className="mt-2 text-sm text-ink-soft">Locating address...</p>
          ) : geocodeFailed ? (
            <p className="mt-2 text-sm text-ink-soft">Couldn&apos;t determine this address&apos;s location.</p>
          ) : nearest.length > 0 ? (
            <div className="mt-2 grid gap-1.5">
              {nearest.map(({ employee: emp, km }) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => onChange({ ...value, assignedEmployeeId: emp.id })}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                    value.assignedEmployeeId === emp.id
                      ? "border-accent bg-accent-soft text-accent-deep"
                      : "border-line bg-white text-ink hover:border-ink-soft"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin size={13} className="shrink-0 text-ink-soft/70" />
                    {emp.name} — {emp.role}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-soft">{formatDistance(km)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">
              No employees are currently sharing their location.
            </p>
          )}
        </div>
      )}

      <div>
        <label className={labelClass}>Assign to employee (optional)</label>
        <select
          value={value.assignedEmployeeId ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              assignedEmployeeId: e.target.value ? Number(e.target.value) : null,
            })
          }
          className={inputClass}
        >
          <option value="">Unassigned</option>
          {(employees ?? []).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} — {emp.role}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-ink-soft/80">
          They&apos;ll get a notification for this delivery.
        </p>
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
        {statusLockedByEmployee && (
          <p className="mt-1.5 text-xs text-ink-soft/80">
            An employee already set this once, so they can&apos;t change it again — you still can.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Payment</label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((s) => {
            const active = value.paymentStatus === s;
            const meta = PAYMENT_STATUS_META[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...value, paymentStatus: s })}
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
        {paymentLockedByEmployee && (
          <p className="mt-1.5 text-xs text-ink-soft/80">
            An employee already set this once, so they can&apos;t change it again — you still can.
          </p>
        )}
      </div>
    </div>
  );
}
