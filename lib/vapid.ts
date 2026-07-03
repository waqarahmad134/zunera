import "server-only";
import { getEnv } from "./cf";

// Dev-only fallback matching a fixed dev keypair (mirrors ADMIN_PASSWORD's
// "admin123" fallback in lib/auth.ts) — production must set
// VAPID_PRIVATE_KEY via `wrangler secret put VAPID_PRIVATE_KEY`, paired
// with the exact VAPID_PUBLIC_KEY in lib/push-public-key.ts.
const DEV_VAPID_PRIVATE_D = "vdppVcwFD3Mn10KkiWyXnW6pT0sGgKyR_DGkOm4lYGE";

export async function vapidPrivateD(): Promise<string | null> {
  const env = await getEnv();
  if (env.VAPID_PRIVATE_KEY) return env.VAPID_PRIVATE_KEY;
  if (process.env.NODE_ENV !== "production") return DEV_VAPID_PRIVATE_D;
  return null;
}
