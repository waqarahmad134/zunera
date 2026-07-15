import { PAYMENT_STATUS_META, type PaymentStatus } from "@/lib/types/orders";

export default function PaymentBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}
