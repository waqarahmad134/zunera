-- In-app + push notifications. for_role + for_id scope who sees it:
-- for_role='admin' (for_id NULL) goes to every admin session; for_role in
-- ('employee','customer') with for_id set goes to that one user only.
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  for_role   TEXT NOT NULL,
  for_id     INTEGER,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  url        TEXT,
  read_at    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (for_role, for_id, created_at);

-- Web Push subscriptions (one row per browser/device), scoped the same way.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  for_role   TEXT NOT NULL,
  for_id     INTEGER,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_recipient ON push_subscriptions (for_role, for_id);
