// Signed session tokens for all three roles. Shared between Node-ish API
// routes and the Edge middleware, so it only uses Web Crypto — same
// constraint as lib/auth.ts's adminSecret().
import "server-only";
import { adminSecret } from "./auth";

export const SESSION_COOKIE = "jw_session";
const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export type Role = "admin" | "employee" | "customer";

export interface SessionPayload {
  role: Role;
  id?: number;
  name?: string;
  exp: number;
}

function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
}

/** Creates a new 30-day session token for the given role. `exp` in the payload is ignored/overwritten. */
export async function createSessionToken(payload: Omit<SessionPayload, "exp">): Promise<string | null> {
  const secret = await adminSecret();
  if (!secret) return null;
  const full: SessionPayload = { ...payload, exp: Date.now() + THIRTY_DAYS_MS };
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(JSON.stringify(full)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return `${payloadB64}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = await adminSecret();
  if (!secret) return null;

  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigHex = token.slice(dot + 1);

  const enc = new TextEncoder();
  const key = await hmacKey(secret);
  const expectedSig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  if (!timingSafeEqual(toHex(expectedSig), sigHex)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (payload.role !== "admin" && payload.role !== "employee" && payload.role !== "customer") return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  maxAge: THIRTY_DAYS_MS / 1000,
};
