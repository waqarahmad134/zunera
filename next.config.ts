import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local-only: keep production builds in a separate folder so running
  // `npm run build` can never corrupt the dev server's cache (which caused
  // random 404s). On Vercel the default .next must be used.
  distDir: process.env.VERCEL
    ? ".next"
    : process.env.NODE_ENV === "production"
      ? ".next-prod"
      : ".next",
  // The admin content API reads content/*.json with fs at runtime; make sure
  // those files ship with the serverless function on Vercel.
  outputFileTracingIncludes: {
    "/api/admin/content": ["./content/**/*"],
  },
};

export default nextConfig;
