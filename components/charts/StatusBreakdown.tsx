"use client";

import { motion } from "framer-motion";
import { STATUSES, STATUS_META, type OrderStatus } from "@/lib/orders";

/**
 * Part-to-whole status breakdown: a single stacked bar (status palette,
 * fixed colors — never themed) with a 2px surface gap between segments, plus
 * a legend row since there are >=2 series. Each status is direct-labeled
 * where the segment is wide enough; the legend always carries the count.
 */
export default function StatusBreakdown({
  counts,
}: {
  counts: Record<OrderStatus, number>;
}) {
  const total = STATUSES.reduce((sum, s) => sum + counts[s], 0);

  return (
    <div>
      <div className="flex h-8 w-full gap-[2px] overflow-hidden rounded-lg bg-paper-soft">
        {STATUSES.map((s) => {
          const count = counts[s];
          if (total === 0 || count === 0) return null;
          const pct = (count / total) * 100;
          const wide = pct > 14;
          return (
            <motion.div
              key={s}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
              style={{ background: STATUS_META[s].color }}
              className="flex h-full items-center justify-center"
            >
              {wide && (
                <span className="text-[11px] font-semibold text-white">{count}</span>
              )}
            </motion.div>
          );
        })}
        {total === 0 && (
          <div className="grid w-full place-items-center">
            <p className="text-xs text-muted">No orders yet</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: STATUS_META[s].color }}
            />
            <span className="text-ink-soft">{STATUS_META[s].label}</span>
            <span className="font-medium tabular-nums">{counts[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
