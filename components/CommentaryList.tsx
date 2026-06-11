"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Mic, PenLine } from "lucide-react";
import { opinions, interviews } from "@/lib/data";

type Tab = "all" | "opinions" | "interviews";

const tabs: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "opinions", label: "Opinions" },
  { id: "interviews", label: "Interviews" },
];

const items = [
  ...opinions.map((o) => ({ ...o, kind: "opinions" as const })),
  ...interviews.map((i) => ({ ...i, kind: "interviews" as const })),
].sort((a, b) => b.year - a.year);

export default function CommentaryList() {
  const [tab, setTab] = useState<Tab>("all");

  const visible = useMemo(
    () => (tab === "all" ? items : items.filter((i) => i.kind === tab)),
    [tab]
  );

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const active = tab === t.id;
          const count =
            t.id === "all"
              ? items.length
              : items.filter((i) => i.kind === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                active ? "text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {t.label}{" "}
                <span className={active ? "text-paper/60" : "text-ink-soft/60"}>
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-8 grid gap-3">
        <AnimatePresence mode="popLayout">
          {visible.map((item, i) => (
            <motion.a
              key={item.href + item.title}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.025, 0.4) }}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-5 rounded-2xl border border-line bg-white/60 p-5 sm:p-6 transition-colors duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)]"
            >
              <span className="mt-0.5 shrink-0 rounded-full bg-accent-soft p-2 text-accent">
                {item.kind === "opinions" ? <PenLine size={15} /> : <Mic size={15} />}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-base sm:text-lg leading-snug group-hover:text-accent-deep transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-ink-soft">
                  <span className="italic">{item.outlet}</span> · {item.date}
                </p>
              </div>
              <ArrowUpRight
                size={17}
                className="ml-auto shrink-0 text-line group-hover:text-accent transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
