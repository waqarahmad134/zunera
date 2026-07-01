"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

const VARIANTS = {
  // Default: themed to match the surrounding (light or dark) surface.
  default: "border-line text-ink-soft hover:border-accent hover:text-accent",
  // For placement on a surface that stays dark regardless of site theme
  // (e.g. the admin top bar), so it can't rely on the themed tokens.
  onDark: "border-white/15 text-white/75 hover:border-white/40 hover:text-white",
};

// Reads the current theme from the <html> class (set before paint by the inline
// script in the layout), lets the user toggle it, and persists the choice.
export default function ThemeToggle({
  variant = "default",
}: {
  variant?: keyof typeof VARIANTS;
}) {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore storage errors (private mode, etc.) */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`relative grid size-9 place-items-center rounded-full border transition-colors ${VARIANTS[variant]}`}
    >
      {/* Render nothing icon-wise until mounted to avoid a hydration mismatch. */}
      {mounted && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={dark ? "sun" : "moon"}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 grid place-items-center"
          >
            {dark ? <Sun size={17} /> : <Moon size={16} />}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
}
