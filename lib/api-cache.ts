import { NextResponse } from "next/server";

/**
 * Lets the requesting browser reuse a GET response for `seconds` instead of
 * re-querying D1 on every reload — protects the API/DB from repeated reload
 * spam (an employee or customer refreshing the app over and over). `private`
 * keeps it out of any shared/CDN cache; only the browser that made the
 * request may store it, since these responses carry per-user data.
 *
 * Kept short (single-digit to low tens of seconds) because this app is
 * write-heavy: after a create/update/delete, the page's own follow-up fetch
 * must use `{ cache: "no-store" }` (see client `load()` functions) so the
 * user who just made the change never sees their own stale cached response.
 */
export function cached<T extends NextResponse>(res: T, seconds: number): T {
  res.headers.set("Cache-Control", `private, max-age=${seconds}`);
  return res;
}
