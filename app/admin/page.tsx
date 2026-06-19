"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen, FileText, Library, FlaskConical, PenLine, Mic, Landmark,
  User, Building2, Tags, Newspaper, ChevronRight, Images, Search, EyeOff,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { SECTIONS } from "@/lib/adminConfig";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  site: User,
  pages: EyeOff,
  seo: Search,
  affiliations: Building2,
  books: BookOpen,
  papers: FileText,
  chapters: Library,
  "in-progress": FlaskConical,
  opinions: PenLine,
  interviews: Mic,
  policy: Landmark,
  categories: Tags,
  posts: Newspaper,
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    SECTIONS.filter((s) => !s.singleton).forEach(async (s) => {
      const res = await fetch(`/api/admin/content?section=${s.slug}`);
      if (!res.ok) return;
      const { data } = await res.json();
      setCounts((c) => ({ ...c, [s.slug]: data.length }));
    });
  }, []);

  return (
    <AdminShell title="Dashboard">
      <h1 className="font-serif text-3xl sm:text-4xl">Manage content</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Pick a section to edit. Changes go live on the website after saving.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => {
          const Icon = ICONS[s.slug] ?? FileText;
          return (
            <Link
              key={s.slug}
              href={`/admin/${s.slug}`}
              className="group flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)]"
            >
              <span className="rounded-full bg-accent-soft p-2.5 text-accent shrink-0">
                <Icon size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium text-sm">
                  {s.label}
                  {!s.singleton && counts[s.slug] !== undefined && (
                    <span className="rounded-full bg-paper-soft border border-line px-2 py-0.5 text-xs text-ink-soft">
                      {counts[s.slug]}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-ink-soft leading-relaxed">
                  {s.description}
                </span>
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 self-center text-line group-hover:text-accent transition-colors"
              />
            </Link>
          );
        })}
        <Link
          href="/admin/media"
          className="group flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)]"
        >
          <span className="rounded-full bg-accent-soft p-2.5 text-accent shrink-0">
            <Images size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-medium text-sm">Media</span>
            <span className="mt-1 block text-xs text-ink-soft leading-relaxed">
              All uploaded images: preview, copy links and delete.
            </span>
          </span>
          <ChevronRight
            size={16}
            className="shrink-0 self-center text-line group-hover:text-accent transition-colors"
          />
        </Link>
      </div>
    </AdminShell>
  );
}
