import type { MetadataRoute } from "next";
import { posts } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/books`, priority: 0.9 },
    { url: `${base}/papers`, priority: 0.9 },
    { url: `${base}/chapters`, priority: 0.8 },
    { url: `${base}/in-progress`, priority: 0.7 },
    { url: `${base}/commentary`, priority: 0.8 },
    { url: `${base}/policy`, priority: 0.8 },
    { url: `${base}/blog`, priority: 0.8 },
    { url: `${base}/cv`, priority: 0.5 },
    { url: `${base}/contact`, priority: 0.6 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date + "T00:00:00"),
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
