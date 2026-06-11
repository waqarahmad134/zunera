"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ExternalLink, LayoutDashboard, LogOut } from "lucide-react";

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-serif text-lg hover:text-accent-soft transition-colors"
          >
            <LayoutDashboard size={17} />
            <span className="hidden xs:inline">Admin</span>
          </Link>
          <p className="text-sm text-paper/70 truncate">{title}</p>
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm text-paper/80 hover:bg-paper/10 transition-colors"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">View site</span>
            </a>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm text-paper/80 hover:bg-paper/10 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
