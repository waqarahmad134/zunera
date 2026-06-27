// Access to the Cloudflare runtime bindings (D1, R2, env vars).
//
// On Workers in production these come from the request context; in `next dev`
// they are provided by the local Miniflare simulators that
// `initOpenNextCloudflareForDev()` (see next.config.ts) wires up from
// wrangler.jsonc. Using `{ async: true }` lets this work both inside a request
// and during the brief windows where Next runs server code outside one.
import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
