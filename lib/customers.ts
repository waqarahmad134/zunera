// Client-safe customer types and formatting helpers.

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewCustomerInput {
  name: string;
  phone?: string;
  address: string;
}

/** Summary stats shown on a customer's detail page. */
export interface CustomerSummary {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}
