import { STATUS_META, type OrderStatus } from "@/lib/orders";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
