// Client-safe customer types and formatting helpers.

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string;
  /** Prefills the rate-per-bottle on any new order for them; still editable per order. */
  defaultRatePerBottle: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewCustomerInput {
  name: string;
  phone?: string;
  address: string;
  defaultRatePerBottle?: number | null;
}

/** Summary stats shown on a customer's detail page. */
export interface CustomerSummary {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}
