// Client-safe purchase (goods-received) types.

export interface PurchaseLine {
  id: number;
  itemId: number;
  /** Denormalized from the item record for display, via join. */
  itemName: string;
  qty: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: number;
  supplierId: number;
  /** Denormalized from the supplier record for display, via join. */
  supplierName: string;
  receiptNo: string | null;
  receivedDate: string;
  notes: string | null;
  totalCost: number;
  lines: PurchaseLine[];
  createdAt: string;
  updatedAt: string;
}

export interface NewPurchaseLineInput {
  itemId: number;
  qty: number;
  unitCost: number;
}

export interface NewPurchaseInput {
  supplierId: number;
  receiptNo?: string | null;
  receivedDate: string;
  notes?: string | null;
  lines: NewPurchaseLineInput[];
}
