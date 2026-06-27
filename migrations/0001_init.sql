-- Content store for the site. One row per item; `data` holds the item as JSON.
-- Singleton sections (site, seo, pages) keep a single row at position 0;
-- collection sections keep an ordered list. See lib/db.ts.
CREATE TABLE IF NOT EXISTS content_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  section    TEXT    NOT NULL,
  position   INTEGER NOT NULL DEFAULT 0,
  data       TEXT    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_content_section
  ON content_items (section, position);
