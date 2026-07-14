// Client-safe customer types and formatting helpers.

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string;
  /** House/unit number, separate from the full address text — free-form. */
  houseNo: string | null;
  /** Prefills the rate-per-bottle on any new order for them; still editable per order. */
  defaultRatePerBottle: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewCustomerInput {
  name: string;
  phone?: string;
  address: string;
  houseNo?: string | null;
  defaultRatePerBottle?: number | null;
  notes?: string | null;
}

/** Summary stats shown on a customer's detail page. */
export interface CustomerSummary {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}
