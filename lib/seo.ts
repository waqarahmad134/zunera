// Resolves the site's public URL:
// 1. NEXT_PUBLIC_SITE_URL, if set (set this to your Workers/custom domain)
// 2. CF_PAGES_URL, when deployed on Cloudflare Pages
// 3. localhost in dev
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.CF_PAGES_URL) {
    return process.env.CF_PAGES_URL.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
