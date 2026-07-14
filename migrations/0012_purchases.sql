-- Stock received from a supplier — a receipt header plus its line items.
-- Item current stock is computed as opening_stock + all purchased quantities
-- (no separate mutable stock column to drift out of sync).
CREATE TABLE IF NOT EXISTS purchases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id   INTEGER NOT NULL REFERENCES suppliers(id),
  receipt_no    TEXT,
  received_date TEXT    NOT NULL,
  notes         TEXT,
  total_cost    REAL    NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id),
  item_id     INTEGER NOT NULL REFERENCES items(id),
  qty         INTEGER NOT NULL,
  unit_cost   REAL    NOT NULL,
  line_total  REAL    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_item ON purchase_items (item_id);
