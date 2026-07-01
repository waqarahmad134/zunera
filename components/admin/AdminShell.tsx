"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronRight, ExternalLink, LogOut } from "lucide-react";

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
  const isDashboard = title === "Dashboard";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar is pinned to a stable warm-dark colour so it looks intentional
          in both light and dark site themes. */}
      <header className="sticky top-0 z-40 bg-[#1b1815] text-[#f5f1ea]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity"
          >
            <AdminLogo />
            <span className="font-serif text-lg hidden sm:inline">
              Zunera <span className="text-white/45">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
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

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm">
            <li>
              {isDashboard ? (
                <span className="font-medium text-ink">Dashboard</span>
              ) : (
                <Link
                  href="/admin"
                  className="text-ink-soft hover:text-accent transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </li>
            {!isDashboard && (
              <>
                <li aria-hidden>
                  <ChevronRight size={14} className="text-line" />
                </li>
                <li>
                  <span aria-current="page" className="font-medium text-ink">
                    {title}
                  </span>
                </li>
              </>
            )}
          </ol>
        </nav>
        {children}
      </main>
    </div>
  );
}
