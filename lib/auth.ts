// Shared between the Node API routes and the Edge middleware, so it only
// uses Web Crypto.
import { getEnv } from "./cf";

export const ADMIN_COOKIE = "admin_token";

export async function adminSecret(): Promise<string | null> {
  // Read via getCloudflareContext (see lib/cf.ts), not process.env: secrets
  // set with `wrangler secret put` aren't reliably bridged into process.env
  // inside Next.js Middleware on Cloudflare Workers, only the request's env
  // binding is.
  const env = await getEnv();
  if (env.ADMIN_PASSWORD) return env.ADMIN_PASSWORD;
  // Dev-only fallback so the panel works out of the box locally.
  if (process.env.NODE_ENV !== "production") return "admin123";
  return null;
}

export async function adminToken(): Promise<string | null> {
  const secret = await adminSecret();
  if (!secret) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("jubilee-water-admin-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
