// Supplier types.

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  /** Amount already owed to them before they were added to the system. */
  openingBalance: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewSupplierInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  openingBalance?: number;
  notes?: string | null;
}
