// "Payment In" types — customer payments not tied to a specific order
// (e.g. a lump-sum bank transfer covering past deliveries).

export type PaymentMethod = "cash" | "bank";

export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "bank"];

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; hint: string }> = {
  cash: { label: "Cash", hint: "Goes to cash till" },
  bank: { label: "Bank", hint: "Cheque / transfer" },
};

export interface PaymentIn {
  id: number;
  customerId: number;
  /** Denormalized from the customer record for display, via join. */
  customerName: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewPaymentInInput {
  customerId: number;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  note?: string | null;
}
