"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, LogOut, MapPin, MapPinOff } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useDialogs } from "@/components/ConfirmProvider";

const LOCATION_PING_INTERVAL_MS = 20_000;

export default function StaffShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const { alertDialog } = useDialogs();
  const [sharing, setSharing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pingLocation = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetch("/api/staff/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        }).catch(() => {});
      },
      (err) => {
        // Only PERMISSION_DENIED means sharing genuinely can't continue.
        // TIMEOUT and POSITION_UNAVAILABLE are transient (weak GPS signal,
        // one slow fix, phone briefly backgrounded) and used to silently
        // turn sharing off entirely on the very next ping — just skip this
        // one and let the interval retry.
        if (err.code === err.PERMISSION_DENIED) {
          setSharing(false);
          alertDialog(
            "Location sharing was turned off because location access is blocked for this site. " +
              "Allow location access in your browser's site settings, then turn sharing back on."
          );
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 }
    );
  }, [alertDialog]);

  function toggleSharing() {
    if (sharing) {
      setSharing(false);
      return;
    }
    if (!("geolocation" in navigator)) return;
    setSharing(true);
    pingLocation();
  }

  useEffect(() => {
    if (!sharing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(pingLocation, LOCATION_PING_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sharing, pingLocation]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 bg-white border-b border-line">
        <div className="flex items-center justify-between gap-3 px-4 h-14 lg:px-6">
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.25)]">
              <Droplets size={17} strokeWidth={2.25} />
            </span>
            <span className="text-lg font-semibold tracking-tight">Jubilee Water</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleSharing}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                sharing ? "bg-accent-soft text-accent-deep font-medium" : "text-ink-soft hover:bg-paper-soft"
              }`}
              title={sharing ? "Sharing your location with admin" : "Share your location with admin"}
            >
              {sharing ? <MapPin size={14} /> : <MapPinOff size={14} />}
              <span className="hidden sm:inline">{sharing ? "Sharing location" : "Share location"}</span>
            </button>
            <NotificationBell apiBase="/api/staff" promptIfDisabled />
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-soft transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
    </div>
  );
}
