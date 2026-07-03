"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export interface BarPoint {
  date: string;
  value: number;
}

/**
 * Single-series (sequential, one hue) bar chart for a daily time series.
 * Follows the dataviz mark spec: <=24px bars, 4px rounded data-end square at
 * the baseline, 2px surface gap between bars, hairline recessive gridlines,
 * per-bar hover tooltip (the mark is the hit target — no crosshair needed).
 */
export default function BarChart({
  data,
  color = "#2a78d6",
  formatValue = (n) => String(n),
  emptyLabel = "No data yet",
}: {
  data: BarPoint[];
  color?: string;
  formatValue?: (n: number) => string;
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-lg border border-dashed border-line">
        <p className="text-xs text-muted">Loading...</p>
      </div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const isEmpty = data.every((d) => d.value === 0);

  const gridSteps = [0, 0.5, 1];

  return (
    <div className="relative">
      <div className="relative h-40">
        {/* Hairline gridlines: recessive, one-step-off-surface gray. */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {gridSteps
            .slice()
            .reverse()
            .map((s) => (
              <div key={s} className="border-t border-line" />
            ))}
        </div>

        <div className="relative flex h-full items-end gap-[3px]">
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * 100);
            const isHover = hover === i;
            return (
              <div
                key={d.date}
                className="group relative flex-1 h-full flex items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((v) => (v === i ? null : v))}
                onFocus={() => setHover(i)}
                onBlur={() => setHover((v) => (v === i ? null : v))}
                tabIndex={0}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, delay: i * 0.02, ease: [0.21, 0.47, 0.32, 0.98] }}
                  style={{
                    background: color,
                    opacity: isHover || hover === null ? 1 : 0.45,
                    maxWidth: 24,
                    margin: "0 auto",
                  }}
                  className="w-full rounded-t-[4px] transition-opacity"
                />
                {isHover && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
                    <p className="font-semibold tabular-nums">{formatValue(d.value)}</p>
                    <p className="text-white/70">
                      {new Date(d.date + "T00:00:00Z").toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isEmpty && (
          <div className="absolute inset-0 grid place-items-center">
            <p className="text-xs text-muted">{emptyLabel}</p>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>
          {new Date(data[0]?.date + "T00:00:00Z").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
        <span>
          {new Date(data[data.length - 1]?.date + "T00:00:00Z").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}
