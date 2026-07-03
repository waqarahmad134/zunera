-- Staff records (drivers, office staff, etc.).
CREATE TABLE IF NOT EXISTS employees (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  phone        TEXT,
  role         TEXT NOT NULL,
  salary       REAL NOT NULL,
  joined_date  TEXT NOT NULL,
  -- 'active' | 'inactive'
  status       TEXT NOT NULL DEFAULT 'active',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (status);
