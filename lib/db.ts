// D1 data-access layer.
//
// All site content lives in a single table, `content_items`, with one row per
// item (see migrations/0001_init.sql):
//
//   section TEXT      -- e.g. "posts", "books", "site"
//   position INTEGER  -- ordering within a section (0 for singletons)
//   data TEXT         -- the item itself, as JSON
//
// "Singleton" sections (site, seo, pages) store exactly one row; "collection"
// sections store an ordered list. This mirrors the schema-driven admin in
// lib/adminConfig.ts, so adding a section there needs no schema migration here.
import "server-only";
import { getEnv } from "./cf";

/** Read every item in a section, ordered. Returns `[]` when empty. */
export async function readSection<T = unknown>(section: string): Promise<T[]> {
  const env = await getEnv();
  const { results } = await env.DB.prepare(
    "SELECT data FROM content_items WHERE section = ?1 ORDER BY position ASC, id ASC"
  )
    .bind(section)
    .all<{ data: string }>();
  return (results ?? []).map((r) => JSON.parse(r.data) as T);
}

/** Read a singleton section's object, or `fallback` when it has no row yet. */
export async function readSingleton<T>(section: string, fallback: T): Promise<T> {
  const rows = await readSection<T>(section);
  return rows.length ? rows[0] : fallback;
}

/**
 * Replace a section's contents atomically: delete the existing rows and insert
 * `items` in order. Used for both collections (the whole array) and singletons
 * (pass a single-element array).
 */
export async function writeSection(section: string, items: unknown[]): Promise<void> {
  const env = await getEnv();
  const statements = [
    env.DB.prepare("DELETE FROM content_items WHERE section = ?1").bind(section),
    ...items.map((item, i) =>
      env.DB.prepare(
        "INSERT INTO content_items (section, position, data) VALUES (?1, ?2, ?3)"
      ).bind(section, i, JSON.stringify(item))
    ),
  ];
  await env.DB.batch(statements);
}
