// Types for the Cloudflare bindings this app uses. Regenerate with
// `npm run cf-typegen` after changing wrangler.jsonc.
import type { D1Database, Fetcher } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    /** D1 SQL database holding all orders. */
    DB: D1Database;
    /** Static assets binding injected by OpenNext. */
    ASSETS: Fetcher;
    /** Admin panel password (set with `wrangler secret put ADMIN_PASSWORD`). */
    ADMIN_PASSWORD?: string;
    /**
     * VAPID private key ("d" component, base64url) for signing Web Push
     * requests. Pairs with the public key in lib/push-public-key.ts. Set
     * with `wrangler secret put VAPID_PRIVATE_KEY`.
     */
    VAPID_PRIVATE_KEY?: string;
  }
}

export {};
