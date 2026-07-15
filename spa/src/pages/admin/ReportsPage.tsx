import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, ShoppingBag } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import StatTile from "@/components/charts/StatTile";
import BarChart from "@/components/charts/BarChart";
import { formatCurrency } from "@/lib/types/orders";
import { api } from "@/lib/api";

interface ReportPoint {
  date: string;
  revenue: number;
  expenses: number;
}

interface ReportData {
  from: string;
  to: string;
  granularity: "day" | "month";
  totals: {
    revenue: number;
    expensesTotal: number;
    profit: number;
    orderCount: number;
  };
  series: ReportPoint[];
}

type Preset = "today" | "yesterday" | "week" | "month" | "30days" | "year" | "all";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "30days", label: "Last 30 Days" },
  { id: "year", label: "This Year" },
  { id: "all", label: "All Time" },
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday-based start of the calendar week containing `d`. */
function startOfWeek(d: Date): Date {
  const day = d.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(d);
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  return start;
}

function rangeFor(preset: Preset): { from: string | null; to: string } {
  const today = new Date();
  const to = toISODate(today);
  switch (preset) {
    case "today":
      return { from: to, to };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const iso = toISODate(yesterday);
      return { from: iso, to: iso };
    }
    case "week": {
      const from = startOfWeek(today);
      return { from: toISODate(from), to };
    }
    case "month": {
      const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      return { from: toISODate(from), to };
    }
    case "30days": {
      const from = new Date(today);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from: toISODate(from), to };
    }
    case "year": {
      const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      return { from: toISODate(from), to };
    }
    case "all":
      return { from: null, to };
  }
}

export default function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [report, setReport] = useState<ReportData | null>(null);

  const { from, to } = useMemo(() => rangeFor(preset), [preset]);

  useEffect(() => {
    let cancelled = false;
    setReport(null);
    const params = new URLSearchParams({ to });
    if (from) params.set("from", from);
    api
      .get<ReportData>(`/admin/reports?${params}`)
      .then((d) => {
        if (!cancelled) setReport(d);
      })
      .catch(() => {
        if (!cancelled) setReport(null);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const loading = report === null;
  const totals = report?.totals ?? { revenue: 0, expensesTotal: 0, profit: 0, orderCount: 0 };
  const profitPositive = totals.profit >= 0;

  return (
    <AdminShell title="Reports">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reports</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Revenue, expenses and profit over a date range.</p>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              preset === p.id
                ? "bg-ink text-white"
                : "text-ink-soft hover:bg-paper-soft border border-line"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Revenue" value={totals.revenue} format={loading ? undefined : formatCurrency(totals.revenue)} loading={loading} index={0} />
        <StatTile icon={Receipt} label="Expenses" value={totals.expensesTotal} format={loading ? undefined : formatCurrency(totals.expensesTotal)} loading={loading} index={1} accentColor="#d03b3b" />
        <StatTile
          icon={profitPositive ? TrendingUp : TrendingDown}
          label="Profit"
          value={totals.profit}
          format={loading ? undefined : formatCurrency(totals.profit)}
          loading={loading}
          index={2}
          accentColor={profitPositive ? "#0ca30c" : "#d03b3b"}
        />
        <StatTile icon={ShoppingBag} label="Orders" value={totals.orderCount} loading={loading} index={3} />
      </div>

      <div className="mt-4 sm:mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Revenue</h2>
          <div className="mt-5">
            <BarChart data={report?.series?.map((s) => ({ date: s.date, value: s.revenue })) ?? []} formatValue={formatCurrency} />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="text-base font-semibold">Expenses</h2>
          <div className="mt-5">
            <BarChart
              data={report?.series?.map((s) => ({ date: s.date, value: s.expenses })) ?? []}
              formatValue={formatCurrency}
              color="#d03b3b"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
