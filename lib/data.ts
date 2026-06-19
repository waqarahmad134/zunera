import siteJson from "@/content/site.json";
import affiliationsJson from "@/content/affiliations.json";
import booksJson from "@/content/books.json";
import papersJson from "@/content/papers.json";
import chaptersJson from "@/content/chapters.json";
import inProgressJson from "@/content/in-progress.json";
import opinionsJson from "@/content/opinions.json";
import interviewsJson from "@/content/interviews.json";
import policyJson from "@/content/policy.json";
import categoriesJson from "@/content/categories.json";
import postsJson from "@/content/posts.json";
import pagesJson from "@/content/pages.json";

export const pages: Record<string, boolean> = pagesJson;

export function isComingSoon(slug: string): boolean {
  return Boolean(pages[slug]);
}

export const site = {
  name: siteJson.name,
  role: siteJson.role,
  tagline: siteJson.tagline,
  bio: siteJson.bio,
  portrait: siteJson.portrait || "/portrait.webp",
  interests: siteJson.interests,
  affiliations: affiliationsJson,
  email: { academic: siteJson.emailAcademic, personal: siteJson.emailPersonal },
  socials: { twitter: siteJson.twitter, linkedin: siteJson.linkedin },
};

export const books = booksJson;

export const papers = papersJson.map((p) => ({
  ...p,
  coAuthors: p.coAuthors || null,
}));

export const chapters = chaptersJson.map((c) => ({
  ...c,
  editors: c.editors || null,
}));

export const inProgress = inProgressJson;
export const opinions = opinionsJson;
export const interviews = interviewsJson;

export const policy = policyJson.map((p) => ({
  ...p,
  date: p.date || null,
}));

export const categories = categoriesJson;

export const posts = postsJson
  .filter((p) => p.published)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export const navLinks = [
  { href: "/books", label: "Books" },
  { href: "/papers", label: "Papers" },
  { href: "/chapters", label: "Chapters" },
  { href: "/in-progress", label: "In Progress" },
  { href: "/commentary", label: "Commentary" },
  { href: "/policy", label: "Policy" },
  { href: "/blog", label: "Blog" },
  { href: "/cv", label: "CV" },
  { href: "/contact", label: "Contact" },
];
