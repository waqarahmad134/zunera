import type { MetadataRoute } from "next";
import { getPages, getPosts } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [pages, posts] = await Promise.all([getPages(), getPosts()]);
  const comingSoon = (slug: string) => Boolean(pages[slug]);

  // Routes tied to a toggleable section; excluded while "Coming soon".
  const sectionRoutes = [
    { slug: "books", priority: 0.9 },
    { slug: "papers", priority: 0.9 },
    { slug: "chapters", priority: 0.8 },
    { slug: "in-progress", priority: 0.7 },
    { slug: "commentary", priority: 0.8 },
    { slug: "policy", priority: 0.8 },
    { slug: "blog", priority: 0.8 },
  ].filter((r) => !comingSoon(r.slug));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    ...sectionRoutes.map((r) => ({ url: `${base}/${r.slug}`, priority: r.priority })),
    { url: `${base}/cv`, priority: 0.5 },
    { url: `${base}/contact`, priority: 0.6 },
  ];

  // Individual posts only when the Blog itself is live.
  const postRoutes: MetadataRoute.Sitemap = comingSoon("blog")
    ? []
    : posts.map((p) => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.date + "T00:00:00"),
        priority: 0.7,
      }));

  return [...staticRoutes, ...postRoutes];
}
