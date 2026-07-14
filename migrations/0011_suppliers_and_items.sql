-- Vendors the business buys stock from, and the stock items themselves.
-- Kept as a standalone procurement/catalog module for now — existing orders
-- still record deliveries as bottles x rate, unchanged.
CREATE TABLE IF NOT EXISTS suppliers (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  phone            TEXT,
  address          TEXT,
  opening_balance  REAL    NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  cost           REAL    NOT NULL DEFAULT 0,
  margin         REAL    NOT NULL DEFAULT 0,
  -- 1 if riders must collect an empty back from the customer (e.g. 19L refills).
  returnable     INTEGER NOT NULL DEFAULT 0,
  opening_stock  INTEGER NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
