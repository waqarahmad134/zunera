import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Check } from "lucide-react";
import type { Notification } from "@/lib/types/notifications";
import { VAPID_PUBLIC_KEY } from "@/lib/push-public-key";
import { api } from "@/lib/api";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padded = base64Url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/**
 * Notification bell + inbox, polling `${apiBase}/notifications` and offering
 * to enable Web Push.
 *
 * @param apiBase Role route prefix under the API base, e.g. "/admin", "/staff", "/portal".
 * @param promptIfDisabled Show a dismissible popup (once per browser tab
 * session) nudging the user to enable push when it's off or blocked, instead
 * of relying on them noticing the small "Enable push" link inside the bell
 * dropdown.
 */
export default function NotificationBell({
  apiBase,
  promptIfDisabled = false,
}: {
  apiBase: string;
  promptIfDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [pushState, setPushState] = useState<"unknown" | "unsupported" | "off" | "on" | "denied">("unknown");
  const [promptDismissed, setPromptDismissed] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const dismissKey = `push-prompt-dismissed:${apiBase}`;

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const body = await api
        .get<{ notifications: Notification[]; unread: number }>(`${apiBase}/notifications`)
        .catch(() => null);
      if (!body || cancelled) return;
      setNotifications(body.notifications ?? []);
      setUnread(body.unread ?? 0);
    }
    poll();
    const handle = setInterval(poll, 20000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [apiBase]);

  useEffect(() => {
    if (promptIfDisabled) {
      const dismissed = sessionStorage.getItem(dismissKey) === "1";
      Promise.resolve().then(() => setPromptDismissed(dismissed));
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      Promise.resolve().then(() => setPushState("unsupported"));
      return;
    }
    if (Notification.permission === "denied") {
      Promise.resolve().then(() => setPushState("denied"));
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setPushState(sub ? "on" : "off");
        // The browser can still hold a subscription the server has since
        // lost track of (a wiped/rotated DB row, a re-assigned recipient,
        // etc.) — that shows as "on" here while push silently never
        // arrives. Re-upserting on every load makes it self-healing.
        if (sub) {
          api.post(`${apiBase}/push/subscribe`, sub.toJSON()).catch(() => {});
        }
      })
      .catch(() => setPushState("unsupported"));
  }, [apiBase, promptIfDisabled, dismissKey]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await api.post(`${apiBase}/notifications`).catch(() => {});
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  async function enablePush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
      await api.post(`${apiBase}/push/subscribe`, sub.toJSON());
      setPushState("on");
    } catch {
      setPushState("off");
    }
  }

  function dismissPrompt() {
    setPromptDismissed(true);
    sessionStorage.setItem(dismissKey, "1");
  }

  const showPrompt =
    promptIfDisabled && !promptDismissed && (pushState === "off" || pushState === "denied");

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggle}
        className="relative rounded-full p-2 text-ink-soft hover:bg-paper-soft transition-colors"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing size={18} className="text-accent" /> : <Bell size={18} />}
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white shadow-[0_8px_30px_rgba(11,11,11,0.10)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {(pushState === "off" || pushState === "unknown") && (
              <button
                onClick={enablePush}
                className="text-xs font-medium text-accent hover:text-accent-deep transition-colors"
              >
                Enable push
              </button>
            )}
            {pushState === "on" && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                <Check size={12} /> Push on
              </span>
            )}
            {pushState === "denied" && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                <BellOff size={12} /> Blocked
              </span>
            )}
          </div>
          {pushState === "denied" && (
            <div className="border-b border-line bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              Push notifications are blocked for this site. To turn them back
              on, open your browser&apos;s site settings for this page
              (usually via the lock or info icon next to the address bar),
              allow notifications, then reload the page.
            </div>
          )}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-soft">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b border-line px-4 py-3 last:border-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>
                  <p className="mt-1 text-[11px] text-ink-soft/70">{formatRelativeTime(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={dismissPrompt}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_60px_rgba(11,11,11,0.25)]"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                <BellOff size={16} />
              </span>
              <p className="text-sm font-semibold">Notifications are off</p>
            </div>
            <p className="mt-2.5 text-sm text-ink-soft">
              {pushState === "denied"
                ? "Push notifications are blocked for this site, so you won't be alerted about new orders or updates. Allow notifications in your browser's site settings for this page, then reload."
                : "Turn on push notifications so you don't miss new orders or status updates when the app isn't open in front of you."}
            </p>
            <div className="mt-4 flex items-center gap-2.5">
              {pushState === "off" && (
                <button
                  onClick={async () => {
                    await enablePush();
                    dismissPrompt();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
                >
                  Enable notifications
                </button>
              )}
              <button
                onClick={dismissPrompt}
                className="rounded-xl border border-line px-3.5 py-2 text-sm text-ink-soft transition-colors hover:border-ink-soft"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
