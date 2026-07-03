"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export default function Drawer({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-ink-soft truncate">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 rounded-full p-2 text-ink-soft hover:bg-paper-soft transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
            {footer && (
              <div className="flex items-center gap-3 border-t border-line px-5 py-4 sm:px-7">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
