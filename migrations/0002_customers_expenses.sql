-- Customers: a saved book of who orders water, so orders can reference them
-- instead of retyping name/address every time.
CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);

-- Business expenses (fuel, stock, salaries, etc.), for the profit report.
CREATE TABLE IF NOT EXISTS expenses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  -- 'fuel' | 'stock' | 'salaries' | 'maintenance' | 'other'
  category     TEXT NOT NULL,
  amount       REAL NOT NULL,
  expense_date TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);

-- Link orders to customers. Nullable at the schema level (SQLite can't add a
-- NOT NULL column with no default to an existing table in one step) but
-- required by the application for every new order from here on.
ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);

-- Backfill: turn each distinct (customer_name, address) pair already on
-- orders into a customer row, then point those orders at it. No-op on an
-- empty orders table.
INSERT INTO customers (name, address, created_at)
SELECT DISTINCT customer_name, address, datetime('now')
FROM orders
WHERE customer_id IS NULL;

UPDATE orders
SET customer_id = (
  SELECT c.id FROM customers c
  WHERE c.name = orders.customer_name AND c.address = orders.address
  LIMIT 1
)
WHERE customer_id IS NULL;

-- customer_name is now redundant — the customer's name is looked up via
-- customer_id. address stays: it's the per-order delivery address (defaults
-- from the customer but stays editable per order).
ALTER TABLE orders DROP COLUMN customer_name;
