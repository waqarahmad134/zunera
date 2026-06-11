// Resolves the site's public URL dynamically:
// 1. NEXT_PUBLIC_SITE_URL env var, if explicitly set (manual override)
// 2. The Vercel production domain (your .vercel.app now; switches to the
//    custom domain automatically once one is assigned as primary)
// 3. localhost in dev
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
