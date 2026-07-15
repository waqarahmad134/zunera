import AdminShell from "@/components/AdminShell";
import LiveMap from "@/components/LiveMap";

export default function MapPage() {
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
