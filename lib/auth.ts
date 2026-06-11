// Shared between the Node API routes and the Edge middleware, so it only
// uses Web Crypto.

export const ADMIN_COOKIE = "admin_token";

export function adminSecret(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  // Dev-only fallback so the panel works out of the box locally.
  if (process.env.NODE_ENV !== "production") return "admin123";
  return null;
}

export async function adminToken(): Promise<string | null> {
  const secret = adminSecret();
  if (!secret) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("zunera-admin-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
