import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

// Wires up the Cloudflare bindings (D1) so `getCloudflareContext()` works
// under `next dev`, using the local Miniflare simulator from wrangler.jsonc.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
