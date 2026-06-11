import {
  site, books, papers, chapters, inProgress, opinions, interviews,
  policy, posts, categories,
} from "@/lib/data";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const base = siteUrl();

  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.role}. ${site.tagline}`,
    "",
    site.bio,
    "",
    `Research interests: ${site.interests.join(", ")}.`,
    "",
    "Affiliations:",
    ...site.affiliations.map((a) => `- ${a.detail}, ${a.label} (${a.href})`),
    "",
    "## Pages",
    "",
    `- [Home](${base}/): Profile, featured book and recent work`,
    `- [Books](${base}/books): Authored and edited books`,
    `- [Papers](${base}/papers): Peer-reviewed journal articles`,
    `- [Book Chapters](${base}/chapters): Chapters in edited volumes`,
    `- [In Progress](${base}/in-progress): Ongoing research projects`,
    `- [Commentary](${base}/commentary): Op-eds and media interviews`,
    `- [Policy](${base}/policy): Policy reports and briefs`,
    `- [Blog](${base}/blog): Notes and reflections`,
    `- [Contact](${base}/contact): Email and social profiles`,
    "",
    "## Books",
    "",
    ...books.map(
      (b) => `- ${b.title} (${b.publisher}, ${b.year}): ${b.href}`
    ),
    "",
    "## Peer-reviewed Papers",
    "",
    ...papers.map(
      (p) =>
        `- (${p.year}) ${p.title}${p.coAuthors ? `, ${p.coAuthors}` : ""}. ${p.journal}. ${p.href}`
    ),
    "",
    "## Book Chapters",
    "",
    ...chapters.map(
      (c) => `- (${c.year}) ${c.title}. In: ${c.book} (${c.publisher}). ${c.href}`
    ),
    "",
    "## Research In Progress",
    "",
    ...inProgress.map((p) => `- ${p.title}: ${p.description}`),
    "",
    "## Policy Publications",
    "",
    ...policy.map((p) => `- (${p.year}) ${p.title}. ${p.org}. ${p.href}`),
    "",
    "## Selected Commentary",
    "",
    ...opinions.slice(0, 10).map(
      (o) => `- (${o.date}) ${o.title}. ${o.outlet}. ${o.href}`
    ),
    "",
    "## Selected Interviews",
    "",
    ...interviews.slice(0, 5).map(
      (i) => `- (${i.date}) ${i.title}. ${i.outlet}. ${i.href}`
    ),
    "",
    "## Blog Posts",
    "",
    ...posts.map((p) => {
      const cat = categories.find((c) => c.slug === p.category)?.name;
      return `- [${p.title}](${base}/blog/${p.slug})${cat ? ` (${cat})` : ""}: ${p.excerpt}`;
    }),
    "",
    "## Contact",
    "",
    `- Academic email: ${site.email.academic}`,
    `- Personal email: ${site.email.personal}`,
    `- Twitter/X: ${site.socials.twitter}`,
    `- LinkedIn: ${site.socials.linkedin}`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
