-- Water bottle delivery orders. Each row is one customer order/entry.
CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name    TEXT    NOT NULL,
  address          TEXT    NOT NULL,
  bottles          INTEGER NOT NULL,
  rate_per_bottle  REAL    NOT NULL,
  total_price      REAL    NOT NULL,
  -- 'pending' | 'delivered' | 'cancelled'
  status           TEXT    NOT NULL DEFAULT 'pending',
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);
