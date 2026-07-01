"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, FileText, Library, FlaskConical, PenLine, Mic, Landmark,
  User, Building2, Tags, Newspaper, ChevronRight, Images, Search, EyeOff,
  Layers, Database, CheckCircle2,
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

const ease = [0.21, 0.47, 0.32, 0.98] as const;

// Eased count-up for the stat numbers.
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startTs = 0;
    const duration = 900;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

function StatTile({
  icon: Icon,
  label,
  value,
  index,
  loading,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  index: number;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease }}
      className="rounded-2xl border border-line bg-white/70 p-5 sm:p-6"
    >
      <span className="inline-flex rounded-full bg-accent-soft p-2.5 text-accent">
        <Icon size={18} />
      </span>
      <p className="mt-4 font-serif text-4xl tabular-nums">
        {loading ? "—" : <CountUp value={value} />}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </motion.div>
  );
}

function BarChart({
  data,
  loading,
}: {
  data: { slug: string; label: string; value: number }[];
  loading: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-5 sm:p-7">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex rounded-full bg-accent-soft p-2 text-accent">
          <Newspaper size={16} />
        </span>
        <h2 className="font-serif text-xl">Content by section</h2>
      </div>
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-paper-soft animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3.5">
          {data.map((d, i) => (
            <div key={d.slug} className="flex items-center gap-3">
              <Link
                href={`/admin/${d.slug}`}
                className="w-28 sm:w-36 shrink-0 truncate text-sm text-ink-soft hover:text-accent transition-colors"
                title={d.label}
              >
                {d.label}
              </Link>
              <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-paper-soft">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.value / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.06, ease }}
                  className="h-full rounded-lg bg-gradient-to-r from-accent to-accent-deep"
                />
                <span className="absolute inset-y-0 right-2.5 flex items-center text-xs font-medium tabular-nums text-ink">
                  {d.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [publishedPosts, setPublishedPosts] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    const collections = SECTIONS.filter((s) => !s.singleton);

    (async () => {
      const entries = await Promise.all(
        collections.map(async (s) => {
          const res = await fetch(`/api/admin/content?section=${s.slug}`);
          if (!res.ok) return { slug: s.slug, count: 0, published: null as number | null };
          const { data } = await res.json();
          const arr: { published?: boolean }[] = Array.isArray(data) ? data : [];
          const published =
            s.slug === "posts" ? arr.filter((p) => p.published).length : null;
          return { slug: s.slug, count: arr.length, published };
        })
      );

      const next: Record<string, number> = {};
      for (const e of entries) {
        next[e.slug] = e.count;
        if (e.published !== null) setPublishedPosts(e.published);
      }
      setCounts(next);
    })();

    fetch("/api/admin/media")
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((b) => setMediaCount(b.files?.length ?? 0))
      .catch(() => {});
  }, []);

  const loading = counts === null;
  const totalItems = counts
    ? Object.values(counts).reduce((a, b) => a + b, 0)
    : 0;

  const chartData = SECTIONS.filter((s) => !s.singleton)
    .map((s) => ({ slug: s.slug, label: s.label, value: counts?.[s.slug] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const stats = [
    { icon: Database, label: "Total content items", value: totalItems },
    { icon: CheckCircle2, label: "Published posts", value: publishedPosts },
    { icon: Images, label: "Media files", value: mediaCount },
    { icon: Layers, label: "Editable sections", value: SECTIONS.length },
  ];

  return (
    <AdminShell title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-serif text-3xl sm:text-4xl">Manage content</h1>
        <p className="mt-2 text-sm text-ink-soft">
          An overview of everything on the site. Pick a section to edit — changes
          go live immediately after saving.
        </p>
      </motion.div>

      {/* Stat tiles */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <StatTile
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            index={i}
            loading={loading}
          />
        ))}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease }}
        className="mt-4 sm:mt-5"
      >
        <BarChart data={chartData} loading={loading} />
      </motion.div>

      {/* Sections */}
      <h2 className="mt-10 mb-4 font-serif text-2xl">Sections</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s, i) => {
          const Icon = ICONS[s.slug] ?? FileText;
          return (
            <motion.div
              key={s.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3), ease }}
            >
              <Link
                href={`/admin/${s.slug}`}
                className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white/70 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)]"
              >
                <span className="rounded-full bg-accent-soft p-2.5 text-accent shrink-0">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium text-sm">
                    {s.label}
                    {!s.singleton && counts?.[s.slug] !== undefined && (
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
            </motion.div>
          );
        })}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease }}
        >
          <Link
            href="/admin/media"
            className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-white/70 p-5 transition-all duration-200 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)]"
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
        </motion.div>
      </div>
    </AdminShell>
  );
}
