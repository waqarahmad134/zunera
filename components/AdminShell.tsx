"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, ListOrdered, LogOut, Menu, X, Droplets, Users, Receipt, BarChart3, IdCard, Map,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

function Logo() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.25)]">
      <Droplets size={17} strokeWidth={2.25} />
    </span>
  );
}

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/employees", label: "Employees", icon: IdCard },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/map", label: "Live map", icon: Map },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-5">
      {NAV.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-accent-soft text-accent-deep font-medium"
                : "text-ink-soft hover:bg-paper-soft hover:text-ink"
            }`}
          >
            <Icon size={17} className={active ? "text-accent" : "text-ink-soft/70"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 bg-white border-b border-line">
        <div className="flex items-center justify-between gap-3 px-4 h-14 lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden -ml-1 rounded-lg p-2 text-ink-soft hover:bg-paper-soft transition-colors"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <Link href="/admin" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
              <Logo />
              <span className="text-lg font-semibold tracking-tight hidden sm:inline">
                Jubilee Water
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell apiBase="/api/admin" promptIfDisabled />
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

      <div className="mx-auto flex max-w-[1400px]">
        <aside className="hidden lg:block lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:shrink-0 lg:border-r lg:border-line lg:bg-white">
          <NavLinks />
        </aside>

        {mobileNavOpen && (
          // z-[1100]: above Leaflet's own panes/controls (z-index up to 1000
          // in leaflet.css), which otherwise render on top of this drawer
          // since the map container doesn't form its own stacking context.
          <div className="fixed inset-0 z-[1100] flex lg:hidden">
            <div
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-ink/40"
            />
            <div className="relative flex h-full w-64 flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-line px-4 h-14">
                <span className="text-sm font-semibold">Menu</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-full p-2 text-ink-soft hover:bg-paper-soft transition-colors"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </div>
              <div className="border-t border-line p-3">
                <button
                  onClick={() => {
                    setMobileNavOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-paper-soft hover:text-ink transition-colors"
                >
                  <LogOut size={17} className="text-ink-soft/70" />
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <h1 className="sr-only">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
