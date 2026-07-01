"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Images, type LucideIcon } from "lucide-react";
import { SECTIONS } from "@/lib/adminConfig";
import { sectionIcon } from "@/components/admin/sectionIcons";
import { useAdminCounts } from "@/lib/useAdminCounts";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-accent-soft text-accent-deep font-medium"
          : "text-ink-soft hover:bg-paper-soft hover:text-ink"
      }`}
    >
      <Icon
        size={16}
        className={active ? "text-accent" : "text-ink-soft/70 group-hover:text-ink-soft"}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.count !== undefined && (
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            active ? "bg-accent/15 text-accent-deep" : "bg-paper-soft text-ink-soft"
          }`}
        >
          {item.count}
        </span>
      )}
    </Link>
  );
}

export default function AdminSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { counts } = useAdminCounts();

  const settingsSections = SECTIONS.filter((s) => s.singleton);
  const contentSections = SECTIONS.filter((s) => !s.singleton);

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
          Overview
        </p>
        <div className="mt-1.5 space-y-0.5">
          <NavLink
            item={{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }}
            active={pathname === "/admin"}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
          Content
        </p>
        <div className="mt-1.5 space-y-0.5">
          {contentSections.map((s) => (
            <NavLink
              key={s.slug}
              item={{
                href: `/admin/${s.slug}`,
                label: s.label,
                icon: sectionIcon(s.slug),
                count: counts?.[s.slug],
              }}
              active={pathname === `/admin/${s.slug}`}
              onNavigate={onNavigate}
            />
          ))}
          <NavLink
            item={{
              href: "/admin/media",
              label: "Media",
              icon: Images,
              count: counts?.media,
            }}
            active={pathname === "/admin/media"}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
          Settings
        </p>
        <div className="mt-1.5 space-y-0.5">
          {settingsSections.map((s) => (
            <NavLink
              key={s.slug}
              item={{
                href: `/admin/${s.slug}`,
                label: s.label,
                icon: sectionIcon(s.slug),
              }}
              active={pathname === `/admin/${s.slug}`}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
