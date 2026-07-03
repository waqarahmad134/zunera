"use client";

import dynamic from "next/dynamic";
import AdminShell from "@/components/AdminShell";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full animate-pulse rounded-2xl border border-line bg-paper-soft" />
  ),
});

export default function LiveMapPage() {
  return (
    <AdminShell title="Live map">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Live map</h1>
      <p className="mt-1.5 text-sm text-ink-soft">
        Where each active employee last shared their location. They opt in from the &quot;Share
        location&quot; toggle in their staff app.
      </p>
      <div className="mt-6">
        <LiveMap />
      </div>
    </AdminShell>
  );
}
