import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EmployeeLocation } from "@/lib/types/locations";
import { formatDateTime } from "@/lib/types/orders";
import { api } from "@/lib/api";

const DEFAULT_CENTER: [number, number] = [30.3753, 69.3451]; // Pakistan, roughly — replaced once locations arrive
const REFRESH_INTERVAL_MS = 15_000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** A small circular avatar (employee initials) instead of a generic map pin. */
function avatarIcon(L: typeof import("leaflet"), name: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#2a78d6;color:#fff;font:600 12px/1 system-ui,sans-serif;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(11,11,11,0.4)">${escapeHtml(
      initials(name)
    )}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function popupHtml(loc: EmployeeLocation): string {
  return `
    <div style="min-width:170px;font-family:inherit;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;flex-shrink:0;border-radius:9999px;background:#2a78d6;color:#fff;font:600 11px/1 system-ui,sans-serif;">${escapeHtml(
          initials(loc.employeeName)
        )}</span>
        <strong style="font-size:13px;">${escapeHtml(loc.employeeName)}</strong>
      </div>
      <div style="font-size:12px;color:#57534e;line-height:1.6;">
        ${escapeHtml(loc.employeeRole)}<br/>
        ${loc.employeePhone ? `${escapeHtml(loc.employeePhone)}<br/>` : ""}
        Updated ${escapeHtml(formatDateTime(loc.updatedAt))}
      </div>
    </div>
  `;
}

export default function LiveMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<number, Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<EmployeeLocation[] | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    import("leaflet").then((L) => setLeaflet(L));
  }, []);

  useEffect(() => {
    if (!leaflet || !containerRef.current || mapRef.current) return;
    const map = leaflet.map(containerRef.current).setView(DEFAULT_CENTER, 5);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [leaflet]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const body = await api.get<{ locations: EmployeeLocation[] }>("/admin/locations").catch(() => null);
      if (!body || cancelled) return;
      setLocations(body.locations ?? []);
    }
    poll();
    const handle = setInterval(poll, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, []);

  useEffect(() => {
    if (!leaflet || !mapRef.current || !locations) return;
    const map = mapRef.current;
    const seen = new Set<number>();

    for (const loc of locations) {
      seen.add(loc.employeeId);
      const existing = markersRef.current.get(loc.employeeId);
      if (existing) {
        existing.setLatLng([loc.lat, loc.lng]);
        existing.setPopupContent(popupHtml(loc));
      } else {
        const marker = leaflet
          .marker([loc.lat, loc.lng], { icon: avatarIcon(leaflet, loc.employeeName) })
          .addTo(map)
          .bindTooltip(loc.employeeName, { permanent: false, direction: "top" })
          .bindPopup(popupHtml(loc));
        markersRef.current.set(loc.employeeId, marker);
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    if (locations.length > 0) {
      const bounds = leaflet.latLngBounds(locations.map((l) => [l.lat, l.lng] as [number, number]));
      map.fitBounds(bounds.pad(0.3), { maxZoom: 14 });
    }
  }, [leaflet, locations]);

  return (
    <div className="relative">
      {/* z-0 pins this as its own stacking context, so Leaflet's internal
          panes/controls (z-index up to 1000 in leaflet.css) stay contained
          here and never render above app chrome like the mobile nav drawer
          or the sticky header. */}
      <div ref={containerRef} className="relative z-0 h-[520px] w-full rounded-2xl border border-line" />
      {locations !== null && locations.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="rounded-xl bg-white/95 px-4 py-2.5 text-sm text-ink-soft shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
            No employees are sharing their location yet.
          </p>
        </div>
      )}
    </div>
  );
}
