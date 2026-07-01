"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, Images, Layers, Database, CheckCircle2 } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { SECTIONS } from "@/lib/adminConfig";
import { useAdminCounts } from "@/lib/useAdminCounts";
import { CountUp } from "@/components/admin/CountUp";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

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

function DashboardBody() {
  const { counts, publishedPosts, mediaCount, loading } = useAdminCounts();

  const collections = SECTIONS.filter((s) => !s.singleton);
  const totalItems = collections.reduce((sum, s) => sum + (counts[s.slug] ?? 0), 0);

  const chartData = collections
    .map((s) => ({ slug: s.slug, label: s.label, value: counts[s.slug] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  const stats = [
    { icon: Database, label: "Total content items", value: totalItems },
    { icon: CheckCircle2, label: "Published posts", value: publishedPosts },
    { icon: Images, label: "Media files", value: mediaCount },
    { icon: Layers, label: "Editable sections", value: SECTIONS.length },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h1 className="font-serif text-3xl sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-sm text-ink-soft">
          An overview of everything on the site. Use the sidebar to jump to a
          section — changes go live immediately after saving.
        </p>
      </motion.div>

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

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease }}
        className="mt-4 sm:mt-5"
      >
        <BarChart data={chartData} loading={loading} />
      </motion.div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <AdminShell title="Dashboard">
      <DashboardBody />
    </AdminShell>
  );
}
