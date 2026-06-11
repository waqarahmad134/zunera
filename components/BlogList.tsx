"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { posts, categories } from "@/lib/data";

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogList() {
  const [cat, setCat] = useState<string>("all");

  const usedCategories = useMemo(
    () => categories.filter((c) => posts.some((p) => p.category === c.slug)),
    []
  );
  const visible = useMemo(
    () => (cat === "all" ? posts : posts.filter((p) => p.category === cat)),
    [cat]
  );

  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  if (posts.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">
        No posts yet. Check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {[{ slug: "all", name: "All" }, ...usedCategories].map((c) => {
          const active = cat === c.slug;
          const count =
            c.slug === "all"
              ? posts.length
              : posts.filter((p) => p.category === c.slug).length;
          return (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                active ? "text-paper" : "text-ink-soft hover:text-ink"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="blog-cat-pill"
                  className="absolute inset-0 rounded-full bg-ink"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {c.name}{" "}
                <span className={active ? "text-paper/60" : "text-ink-soft/60"}>
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((post, i) => (
            <motion.article
              key={post.slug}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
              className="h-full"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white/60 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
              >
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image}
                      alt=""
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-center gap-3 text-xs text-ink-soft">
                  <span className="rounded-full bg-accent-soft px-3 py-1 font-medium text-accent">
                    {catName(post.category)}
                  </span>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </div>
                <h2 className="mt-4 font-serif text-xl sm:text-2xl leading-snug group-hover:text-accent-deep transition-colors">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                  {post.excerpt}
                </p>
                <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                  Read post
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
