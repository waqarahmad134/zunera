// Client-safe order types, status metadata and formatting helpers. No
// server-only imports here — this module is used by client components too.

export type OrderStatus = "pending" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "cash" | "online";

export interface Order {
  id: number;
  customerId: number;
  /** Denormalized from the customer record for display, via join. */
  customerName: string;
  /** Per-order delivery address — defaults from the customer but is editable per order. */
  address: string;
  bottles: number;
  ratePerBottle: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  assignedEmployeeId: number | null;
  /** Denormalized from the employee record for display, via join. */
  assignedEmployeeName: string | null;
  /**
   * Once an employee (not admin) sets status/paymentStatus, the matching
   * flag flips true and the staff app can never change that field on this
   * order again — only admin can. Prevents an employee from repeatedly
   * flip-flopping a delivery/payment outcome after the fact.
   */
  statusLockedByEmployee: boolean;
  paymentLockedByEmployee: boolean;
  /** Free-text, admin-only. */
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields the client sends when creating an order (id/total/timestamps are server-assigned). */
export interface NewOrderInput {
  customerId: number;
  address: string;
  bottles: number;
  ratePerBottle: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  assignedEmployeeId?: number | null;
  notes?: string | null;
}

export const STATUSES: OrderStatus[] = ["pending", "delivered", "cancelled"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "cash", "online"];

// Status colors follow the dataviz "status palette" (fixed, never themed):
// good = delivered, warning = pending, critical = cancelled.
export const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "#fab219",
    bg: "rgba(250,178,25,0.12)",
    border: "rgba(250,178,25,0.35)",
  },
  delivered: {
    label: "Delivered",
    color: "#0ca30c",
    bg: "rgba(12,163,12,0.10)",
    border: "rgba(12,163,12,0.30)",
  },
  cancelled: {
    label: "Cancelled",
    color: "#d03b3b",
    bg: "rgba(208,59,59,0.10)",
    border: "rgba(208,59,59,0.30)",
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  unpaid: {
    label: "Unpaid",
    color: "#d03b3b",
    bg: "rgba(208,59,59,0.10)",
    border: "rgba(208,59,59,0.30)",
  },
  cash: {
    label: "Cash",
    color: "#0ca30c",
    bg: "rgba(12,163,12,0.10)",
    border: "rgba(12,163,12,0.30)",
  },
  online: {
    label: "Online",
    color: "#2a78d6",
    bg: "rgba(42,120,214,0.10)",
    border: "rgba(42,120,214,0.30)",
  },
};

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
