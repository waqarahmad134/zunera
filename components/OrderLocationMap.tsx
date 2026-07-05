"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, Loader2, Navigation, TriangleAlert, X } from "lucide-react";
import { formatDistance, haversineKm } from "@/lib/geo";

type Coords = { lat: number; lng: number };

function meIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:#2a78d6;color:#fff;font:600 11px/1 system-ui,sans-serif;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(11,11,11,0.4)">You</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function deliveryIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px 9999px 9999px 0;transform:rotate(45deg);background:#dc6b19;color:#fff;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(11,11,11,0.4)"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

/** Shows the delivery address and the employee's own live position on a map, with the distance between them — so the driver can confirm they're heading to the right spot instead of guessing from the address text alone. */
export default function OrderLocationMap({
  open,
  onClose,
  address,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const meMarkerRef = useRef<Marker | null>(null);
  const deliveryMarkerRef = useRef<Marker | null>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  const [deliveryLocation, setDeliveryLocation] = useState<Coords | null>(null);
  const [geocoding, setGeocoding] = useState(true);
  const [geocodeFailed, setGeocodeFailed] = useState(false);

  const [myLocation, setMyLocation] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [locateFailed, setLocateFailed] = useState(false);

  useEffect(() => {
    if (open) import("leaflet").then((L) => setLeaflet(L));
  }, [open]);

  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => {
        setLeaflet(null);
        setDeliveryLocation(null);
        setGeocoding(true);
        setGeocodeFailed(false);
        setMyLocation(null);
        setLocating(true);
        setLocateFailed(false);
      });
      return;
    }

    let cancelled = false;
    fetch(`/api/staff/geocode?q=${encodeURIComponent(address)}`)
      .then((r) => (r.ok ? r.json() : { location: null }))
      .then((d) => {
        if (cancelled) return;
        setDeliveryLocation(d.location);
        setGeocodeFailed(!d.location);
      })
      .catch(() => {
        if (!cancelled) setGeocodeFailed(true);
      })
      .finally(() => {
        if (!cancelled) setGeocoding(false);
      });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        () => {
          if (!cancelled) {
            setLocateFailed(true);
            setLocating(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 }
      );
    } else {
      Promise.resolve().then(() => {
        if (cancelled) return;
        setLocateFailed(true);
        setLocating(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [open, address]);

  useEffect(() => {
    if (!open || !leaflet || !containerRef.current || mapRef.current) return;
    const map = leaflet.map(containerRef.current).setView([30.3753, 69.3451], 5);
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
      meMarkerRef.current = null;
      deliveryMarkerRef.current = null;
    };
  }, [open, leaflet]);

  useEffect(() => {
    if (!leaflet || !mapRef.current) return;
    const map = mapRef.current;

    if (deliveryLocation) {
      if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.setLatLng([deliveryLocation.lat, deliveryLocation.lng]);
      } else {
        deliveryMarkerRef.current = leaflet
          .marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon(leaflet) })
          .addTo(map)
          .bindTooltip("Delivery address", { permanent: false, direction: "top" });
      }
    }

    if (myLocation) {
      if (meMarkerRef.current) {
        meMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng]);
      } else {
        meMarkerRef.current = leaflet
          .marker([myLocation.lat, myLocation.lng], { icon: meIcon(leaflet) })
          .addTo(map)
          .bindTooltip("You", { permanent: false, direction: "top" });
      }
    }

    if (deliveryLocation && myLocation) {
      const bounds = leaflet.latLngBounds([
        [deliveryLocation.lat, deliveryLocation.lng],
        [myLocation.lat, myLocation.lng],
      ]);
      map.fitBounds(bounds.pad(0.3), { maxZoom: 16 });
    } else if (deliveryLocation) {
      map.setView([deliveryLocation.lat, deliveryLocation.lng], 15);
    } else if (myLocation) {
      map.setView([myLocation.lat, myLocation.lng], 15);
    }
  }, [leaflet, deliveryLocation, myLocation]);

  if (!open) return null;

  const distanceKm =
    deliveryLocation && myLocation
      ? haversineKm(myLocation.lat, myLocation.lng, deliveryLocation.lat, deliveryLocation.lng)
      : null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div className="flex h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-[0_20px_60px_rgba(11,11,11,0.25)] sm:h-auto sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Navigation size={15} className="text-accent" /> Delivery location
          </p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-soft hover:bg-paper-soft transition-colors"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="border-b border-line bg-paper-soft/60 px-5 py-2.5 text-sm">
          {geocoding || locating ? (
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <Loader2 size={14} className="animate-spin" /> Locating...
            </span>
          ) : distanceKm !== null ? (
            <span className="font-medium text-ink">{formatDistance(distanceKm)} from you</span>
          ) : geocodeFailed ? (
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <TriangleAlert size={13} /> Couldn&apos;t find this address on the map.
            </span>
          ) : locateFailed ? (
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <TriangleAlert size={13} /> Turn on location access to see the distance.
            </span>
          ) : null}
        </div>

        <div ref={containerRef} className="relative z-0 min-h-[340px] flex-1" />

        <div className="border-t border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <a
              href={
                deliveryLocation
                  ? `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
            >
              <ExternalLink size={14} /> Open in Maps for directions
            </a>
            <button
              onClick={onClose}
              className="rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft transition-colors hover:border-ink-soft"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
