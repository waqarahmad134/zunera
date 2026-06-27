// Types for the Cloudflare bindings this app uses. Regenerate the full,
// authoritative version any time you change wrangler.jsonc with:
//
//   npm run cf-typegen
//
// (that runs `wrangler types` and overwrites this file). The hand-written
// interface below is enough for `tsc` and the editor before the first
// generation, and mirrors the bindings declared in wrangler.jsonc.
import type { D1Database, R2Bucket, Fetcher } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    /** D1 SQL database holding all site content (see migrations/). */
    DB: D1Database;
    /** R2 bucket holding all uploaded images (keys under `uploads/`). */
    MEDIA: R2Bucket;
    /** Static assets binding injected by OpenNext. */
    ASSETS: Fetcher;
    /** Admin panel password (set with `wrangler secret put ADMIN_PASSWORD`). */
    ADMIN_PASSWORD?: string;
    /** Optional canonical site URL override. */
    NEXT_PUBLIC_SITE_URL?: string;
  }
}

export {};
