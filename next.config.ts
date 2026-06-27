import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images are served either from /public (portrait) or from R2 via the
  // /uploads/[...] route handler, using plain <img>/<Image unoptimized>.
  // Skipping the optimizer keeps image delivery simple on Workers.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// Wire up the Cloudflare bindings (D1, R2) so that `getCloudflareContext()`
// works while running `next dev`, using the local Miniflare simulators
// configured in wrangler.jsonc.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
