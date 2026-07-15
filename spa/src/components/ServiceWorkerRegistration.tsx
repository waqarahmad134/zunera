import { useEffect } from "react";

/** Registers the PWA service worker once, app-wide. Renders nothing. */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability/push just won't be available — not fatal.
    });
  }, []);
  return null;
}
