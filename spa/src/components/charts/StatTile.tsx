import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startTs = 0;
    const duration = 800;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n.toLocaleString()}</>;
}

export default function StatTile({
  icon: Icon,
  label,
  value,
  index = 0,
  loading = false,
  format,
  accentColor = "#2a78d6",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  index?: number;
  loading?: boolean;
  /** When set, renders this string instead of the animated count (e.g. currency). */
  format?: string;
  accentColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="rounded-2xl border border-line bg-white p-5"
    >
      <span
        className="inline-flex rounded-full p-2.5"
        style={{ background: `${accentColor}1a`, color: accentColor }}
      >
        <Icon size={18} />
      </span>
      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {loading ? "—" : format ?? <CountUp value={value} />}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </motion.div>
  );
}
