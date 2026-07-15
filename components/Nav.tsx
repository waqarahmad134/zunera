"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { NavLink } from "@/lib/data";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav({ items }: { items: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-paper/85 backdrop-blur-md border-b border-line shadow-[0_1px_12px_rgba(33,31,26,0.04)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="mx-auto max-w-6xl px-5 sm:px-8 flex items-center justify-between h-16">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight hover:text-accent transition-colors"
        >
          Zunera
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop */}
          <ul className="hidden lg:flex items-center gap-1">
            {items.map((link, i) => {
              const active = !link.external && pathname === link.href;
              const cls = `px-3 py-2 text-sm transition-colors ${
                active ? "text-accent" : "text-ink-soft hover:text-ink"
              }`;
              return (
                <li key={`${link.href}-${i}`} className="relative">
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={cls}>
                      {link.label}
                    </Link>
                  )}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          <ThemeToggle />

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -mr-1 text-ink-soft hover:text-ink transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-paper/95 backdrop-blur-md border-b border-line"
          >
            <ul className="px-5 pb-4 pt-1">
              {items.map((link, i) => {
                const active = !link.external && pathname === link.href;
                const cls = `block py-2.5 text-base border-b border-line/60 last:border-0 ${
                  active ? "text-accent font-medium" : "text-ink-soft"
                }`;
                return (
                  <motion.li
                    key={`${link.href}-${i}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.25 }}
                  >
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={cls}>
                        {link.label}
                      </Link>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
