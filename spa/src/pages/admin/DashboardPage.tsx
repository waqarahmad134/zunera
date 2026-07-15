import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplet, PackageCheck, Clock3, Wallet } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import StatTile from "@/components/charts/StatTile";
import BarChart from "@/components/charts/BarChart";
import StatusBreakdown from "@/components/charts/StatusBreakdown";
import { formatCurrency } from "@/lib/types/orders";
import { api } from "@/lib/api";

interface DashboardStats {
  totals: {
    orders: number;
    pending: number;
    delivered: number;
    cancelled: number;
    bottles: number;
    revenue: number;
  };
  daily: { date: string; orders: number; revenue: number }[];
}

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<DashboardStats>("/admin/stats")
      .then((d) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = stats === null;
  const totals = stats?.totals ?? {
    orders: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0,
    bottles: 0,
    revenue: 0,
  };

  return (
    <AdminShell title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          An overview of Jubilee Water orders and deliveries.
        </p>
      </motion.div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          icon={Droplet}
          label="Total orders"
          value={totals.orders}
          loading={loading}
          index={0}
        />
        <StatTile
          icon={Clock3}
          label="Pending"
          value={totals.pending}
          loading={loading}
          index={1}
          accentColor="#fab219"
        />
        <StatTile
          icon={PackageCheck}
          label="Delivered"
          value={totals.delivered}
          loading={loading}
          index={2}
          accentColor="#0ca30c"
        />
        <StatTile
          icon={Wallet}
          label="Revenue (excl. cancelled)"
          value={totals.revenue}
          format={loading ? undefined : formatCurrency(totals.revenue)}
          loading={loading}
          index={3}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2, ease }}
        className="mt-4 sm:mt-5 rounded-2xl border border-line bg-white p-5 sm:p-6"
      >
        <h2 className="text-base font-semibold">Order status</h2>
        <div className="mt-4">
          <StatusBreakdown
            counts={{
              pending: totals.pending,
              delivered: totals.delivered,
              cancelled: totals.cancelled,
            }}
          />
        </div>
      </motion.div>

      <div className="mt-4 sm:mt-5 grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28, ease }}
          className="rounded-2xl border border-line bg-white p-5 sm:p-6"
        >
          <h2 className="text-base font-semibold">Orders — last 14 days</h2>
          <div className="mt-5">
            <BarChart data={stats?.daily?.map((d) => ({ date: d.date, value: d.orders })) ?? []} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.34, ease }}
          className="rounded-2xl border border-line bg-white p-5 sm:p-6"
        >
          <h2 className="text-base font-semibold">Revenue — last 14 days</h2>
          <div className="mt-5">
            <BarChart
              data={stats?.daily?.map((d) => ({ date: d.date, value: d.revenue })) ?? []}
              formatValue={(n) => formatCurrency(n)}
            />
          </div>
        </motion.div>
      </div>
    </AdminShell>
  );
}
