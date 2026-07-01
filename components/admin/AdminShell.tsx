"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Drawer from "@/components/admin/Drawer";
import ThemeToggle from "@/components/ThemeToggle";
import { AdminCountsProvider } from "@/lib/useAdminCounts";

function AdminLogo() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-white font-serif italic text-lg leading-none shadow-[inset_0_0_0_1.5px_rgba(250,248,244,0.25)]">
      Z
    </span>
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
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <AdminCountsProvider>
      <div className="min-h-screen bg-paper">
        {/* Top bar is pinned to a stable warm-dark colour so it looks intentional
            in both light and dark site themes. */}
        <header className="sticky top-0 z-30 bg-[#1b1815] text-[#f5f1ea]">
          <div className="flex items-center justify-between gap-3 px-4 h-14 lg:pl-4 lg:pr-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden -ml-1 rounded-lg p-2 text-white/80 hover:bg-white/10 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={19} />
              </button>
              <Link
                href="/admin"
                className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
              >
                <AdminLogo />
                <span className="font-serif text-lg hidden sm:inline">
                  Zunera <span className="text-white/45">Admin</span>
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle variant="onDark" />
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm text-white/75 hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={14} />
                <span className="hidden sm:inline">View site</span>
              </a>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm text-white/75 hover:bg-white/10 transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1400px]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:border-r lg:border-line">
            <AdminSidebar />
          </aside>

          {/* Mobile sidebar overlay */}
          <Drawer
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            side="left"
            widthClassName="max-w-[280px]"
            title="Menu"
          >
            <div className="-mx-5 -my-5 sm:-mx-7">
              <AdminSidebar onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </Drawer>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <h1 className="sr-only">{title}</h1>
            {children}
          </main>
        </div>
      </div>
    </AdminCountsProvider>
  );
}
