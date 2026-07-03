import "server-only";
import { getEnv } from "./cf";

// Built-in fallback so Web Push works out of the box, in dev and in
// production, without requiring `wrangler secret put VAPID_PRIVATE_KEY`
// first. Pairs with the VAPID_PUBLIC_KEY in lib/push-public-key.ts. Set the
// VAPID_PRIVATE_KEY Cloudflare secret to override with your own keypair
// instead (see README) — the secret always wins when present.
const FALLBACK_VAPID_PRIVATE_D = "pcfaP0KeCvXqdQLfUVEBRmu4yXi9UgKTLySbONTPXds";

export async function vapidPrivateD(): Promise<string> {
  const env = await getEnv();
  return env.VAPID_PRIVATE_KEY || FALLBACK_VAPID_PRIVATE_D;
}
