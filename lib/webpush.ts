// Hand-rolled Web Push: VAPID (RFC 8292) request signing + aes128gcm
// message encryption (RFC 8291 / RFC 8188), using only Web Crypto — so it
// runs on the Workers runtime without the `web-push` npm package (which
// expects Node's `https` module and won't work here). Free: no push
// service account needed, browsers deliver to their own vendor endpoint
// (FCM, Mozilla, etc.) using just these VAPID keys.
import "server-only";
import { VAPID_PUBLIC_KEY } from "./push-public-key";
import { vapidPrivateD } from "./vapid";

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Thrown when a push fails with 404/410 — the subscription is gone and the caller should delete it. */
export class PushGoneError extends Error {}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrs) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, lengthBytes: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    lengthBytes * 8
  );
  return new Uint8Array(bits);
}

/** aes128gcm-encrypts `plaintext` for the subscriber, per RFC 8291. */
async function encryptPayload(
  plaintext: Uint8Array,
  p256dhB64: string,
  authB64: string
): Promise<Uint8Array> {
  const uaPublicRaw = fromBase64Url(p256dhB64);
  const authSecret = fromBase64Url(authB64);

  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));

  const remoteKey = await crypto.subtle.importKey(
    "raw",
    uaPublicRaw as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: remoteKey }, localKeyPair.privateKey, 256)
  );

  const enc = new TextEncoder();
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublicRaw, localPublicKeyRaw);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);

  // Single-record aes128gcm content coding: plaintext || 0x02 delimiter (no padding needed).
  const paddedPlaintext = concat(plaintext, new Uint8Array([0x02]));

  const cekKey = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, cekKey, paddedPlaintext as BufferSource)
  );

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);
  const idLen = new Uint8Array([localPublicKeyRaw.length]);

  const header = concat(salt, recordSize, idLen, localPublicKeyRaw);
  return concat(header, ciphertext);
}

function publicKeyXY(rawPoint: Uint8Array): { x: string; y: string } {
  return { x: toBase64Url(rawPoint.slice(1, 33)), y: toBase64Url(rawPoint.slice(33, 65)) };
}

async function vapidPrivateKey(): Promise<CryptoKey | null> {
  const d = await vapidPrivateD();
  if (!d) return null;
  const { x, y } = publicKeyXY(fromBase64Url(VAPID_PUBLIC_KEY));
  return crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", d, x, y, ext: true },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

/** Signs a short-lived VAPID JWT (RFC 8292) for the given push service origin. */
async function vapidJwt(audience: string): Promise<string | null> {
  const key = await vapidPrivateKey();
  if (!key) return null;

  const enc = new TextEncoder();
  const headerB64 = toBase64Url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payloadB64 = toBase64Url(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: "mailto:admin@jubilee-water.local",
      })
    )
  );
  const signingInput = `${headerB64}.${payloadB64}`;
  // Web Crypto's ECDSA signatures are already raw r||s (IEEE P1363), which
  // is exactly the JOSE signature format — no DER conversion needed.
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(signingInput));
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

/** Sends one Web Push message. Throws PushGoneError if the subscription is no longer valid. */
export async function sendWebPush(sub: PushSubscriptionRecord, payload: PushPayload): Promise<void> {
  const enc = new TextEncoder();
  const body = await encryptPayload(enc.encode(JSON.stringify(payload)), sub.p256dh, sub.auth);

  const endpointUrl = new URL(sub.endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  const jwt = await vapidJwt(audience);
  if (!jwt) throw new Error("VAPID key not configured");

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
    },
    body: body as BodyInit,
  });

  if (res.status === 404 || res.status === 410) {
    throw new PushGoneError("Subscription expired");
  }
  if (!res.ok) {
    throw new Error(`Push failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
}
