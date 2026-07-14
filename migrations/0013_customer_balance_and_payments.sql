-- Amount a customer already owed before being added to the system, plus a
-- ledger of payments received that aren't tied to a specific order (e.g. a
-- lump-sum bank transfer covering several past deliveries).
ALTER TABLE customers ADD COLUMN opening_balance REAL NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS payments_in (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id   INTEGER NOT NULL REFERENCES customers(id),
  amount        REAL    NOT NULL,
  payment_date  TEXT    NOT NULL,
  -- 'cash' | 'bank'
  method        TEXT    NOT NULL DEFAULT 'cash',
  note          TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_in_customer ON payments_in (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_in_date ON payments_in (payment_date);
