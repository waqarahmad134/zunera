import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production builds in a separate folder so running `npm run build`
  // can never corrupt the dev server's cache (which caused random 404s).
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
};

export default nextConfig;
