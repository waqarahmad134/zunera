"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EmployeeLocation } from "@/lib/locations";

const DEFAULT_CENTER: [number, number] = [30.3753, 69.3451]; // Pakistan, roughly — replaced once locations arrive
const REFRESH_INTERVAL_MS = 15_000;

function pinIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#2a78d6;border:3px solid #fff;box-shadow:0 1px 4px rgba(11,11,11,0.35)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
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
      const res = await fetch("/api/admin/locations").catch(() => null);
      if (!res?.ok || cancelled) return;
      const body = await res.json();
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
      } else {
        const marker = leaflet
          .marker([loc.lat, loc.lng], { icon: pinIcon(leaflet) })
          .addTo(map)
          .bindTooltip(loc.employeeName, { permanent: false, direction: "top" });
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
