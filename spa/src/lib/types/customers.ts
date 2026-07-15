// Customer types and formatting helpers.

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string;
  /** House/unit number, separate from the full address text — free-form. */
  houseNo: string | null;
  /** Prefills the rate-per-bottle on any new order for them; still editable per order. */
  defaultRatePerBottle: number | null;
  /** Amount they already owed before being added to the system. */
  openingBalance: number;
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
  openingBalance?: number;
  notes?: string | null;
}

/** Summary stats shown on a customer's detail page. */
export interface CustomerSummary {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

/** The "Money" balance summary shown on a customer's detail page. */
export interface CustomerBalance {
  /** Outstanding balance as of the start of today. */
  currentOutstanding: number;
  /** Non-cancelled order totals created today. */
  todaysSale: number;
  /** Payments received today (Payment In entries + orders marked paid today). */
  cashCollected: number;
  /** currentOutstanding + todaysSale - cashCollected. */
  newOutstanding: number;
}
