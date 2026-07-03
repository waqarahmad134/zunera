-- Latest known location per employee — one row each, upserted on every
-- ping, not a full history log.
CREATE TABLE IF NOT EXISTS employee_locations (
  employee_id INTEGER PRIMARY KEY REFERENCES employees(id),
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  accuracy    REAL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
