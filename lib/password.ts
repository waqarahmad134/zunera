// PBKDF2-SHA256 password hashing via Web Crypto — works in the Workers
// runtime, unlike bcrypt-style libraries that expect Node's crypto.
import "server-only";

// Cloudflare Workers bill CPU time per request (as little as 10ms on the
// Free plan, 50ms default on paid) — not wall-clock time, so a "slow but
// off-thread" hash doesn't help. 100k PBKDF2-SHA256 iterations measured at
// ~44ms of pure CPU even on optimized native crypto, and login can run this
// twice per request (employee check, then customer check), which is enough
// on its own to trip "Worker exceeded resource limits". The stored hash
// embeds its own iteration count (see verifyPassword), so lowering this only
// affects newly-created hashes — existing ones keep verifying correctly.
const ITERATIONS = 10_000;
const ALGO = "pbkdf2";

function toBase64(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str);
}

function fromBase64(s: string): Uint8Array {
  const str = atob(s);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

async function deriveBits(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Stored format: pbkdf2$<iterations>$<saltBase64>$<hashBase64> */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveBits(password, salt, ITERATIONS);
  return `${ALGO}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== ALGO) return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;
  try {
    const salt = fromBase64(parts[2]);
    const expected = fromBase64(parts[3]);
    const actual = await deriveBits(password, salt, iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
