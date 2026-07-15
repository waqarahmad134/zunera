import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check, Loader2, MapPin, X } from "lucide-react";
import { api } from "@/lib/api";

const DEFAULT_CENTER: [number, number] = [30.3753, 69.3451]; // Pakistan, roughly

export default function AddressMapPicker({
  open,
  onClose,
  onSelect,
  initialCenter,
  apiBase = "/admin",
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (address: string, coords: { lat: number; lng: number }) => void;
  /** Centers the map here instead of the default view — e.g. the delivery
   * address already typed and forward-geocoded, so the pin starts nearby. */
  initialCenter?: { lat: number; lng: number } | null;
  /** Role route prefix under the API base, e.g. "/admin" or "/staff" —
   * whichever shell this picker is rendered from. */
  apiBase?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (open) import("leaflet").then((L) => setLeaflet(L));
  }, [open]);

  // Create the map once per time the picker opens; tear it down on close so
  // reopening always gets a fresh, correctly-sized instance (Leaflet doesn't
  // cope well with a container that was hidden via unmount then remounted).
  useEffect(() => {
    if (!open || !leaflet || !containerRef.current || mapRef.current) return;

    const start = initialCenter ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
    const map = leaflet.map(containerRef.current).setView([start.lat, start.lng], initialCenter ? 15 : 5);
    leaflet
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      })
      .addTo(map);

    const marker = leaflet
      .marker([start.lat, start.lng], { draggable: true })
      .addTo(map)
      .on("dragend", () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
      });
    markerRef.current = marker;

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    setCoords(initialCenter ?? null);

    // Best-effort: if we didn't already have an address-derived center,
    // recenter on the device's own location once it resolves.
    if (!initialCenter && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.setView([here.lat, here.lng], 15);
          marker.setLatLng([here.lat, here.lng]);
          setCoords(here);
        },
        () => {},
        { maximumAge: 30_000, timeout: 8_000 }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, leaflet, initialCenter]);

  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => {
        setLeaflet(null);
        setCoords(null);
        setAddress(null);
        setFailed(false);
      });
    }
  }, [open]);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setFailed(false);
    });
    api
      .get<{ address: string | null }>(`${apiBase}/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`)
      .then((d) => {
        if (cancelled) return;
        setAddress(d.address);
        setFailed(!d.address);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, apiBase]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div className="flex h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_20px_60px_rgba(11,11,11,0.25)] sm:h-auto sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MapPin size={15} className="text-accent" /> Pin the delivery location
          </p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-soft hover:bg-paper-soft transition-colors"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <p className="border-b border-line bg-paper-soft/60 px-5 py-2 text-xs text-ink-soft">
          Tap or drag the pin to the exact spot — the address fills in automatically.
        </p>

        {/* relative z-0 contains Leaflet's own panes/controls (z-index up to
            1000 in leaflet.css) inside this box instead of letting them
            escape and render above the modal's own header/footer. */}
        <div ref={containerRef} className="relative z-0 min-h-[340px] flex-1" />

        <div className="border-t border-line px-5 py-3.5">
          <p className="flex min-h-[1.25rem] items-center gap-1.5 text-sm">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin text-ink-soft" />
                <span className="text-ink-soft">Looking up address...</span>
              </>
            ) : failed ? (
              <span className="text-ink-soft">Couldn&apos;t look up an address for this spot.</span>
            ) : address ? (
              <span className="text-ink">{address}</span>
            ) : (
              <span className="text-ink-soft">Tap the map to drop a pin.</span>
            )}
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <button
              onClick={() => {
                if (!address || !coords) return;
                onSelect(address, coords);
                onClose();
              }}
              disabled={!address || !coords}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-50"
            >
              <Check size={14} /> Use this address
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft transition-colors hover:border-ink-soft"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
