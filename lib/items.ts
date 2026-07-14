// Client-safe item (stock catalog) types and formatting helpers.

export interface Item {
  id: number;
  name: string;
  cost: number;
  margin: number;
  /** Default sale price = cost + margin. */
  salePrice: number;
  /** Riders must collect an empty back from the customer (e.g. 19L refills). */
  returnable: boolean;
  openingStock: number;
  /** Opening stock plus everything received via Purchases since. */
  currentStock: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewItemInput {
  name: string;
  cost?: number;
  margin?: number;
  returnable?: boolean;
  openingStock?: number;
  notes?: string | null;
}
