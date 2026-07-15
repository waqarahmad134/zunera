import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/lib/auth";

export default function PortalShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
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
            <NotificationBell apiBase="/portal" />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-soft transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
    </div>
  );
}
