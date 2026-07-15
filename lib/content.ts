// Server-side content access, backed by Cloudflare D1.
//
// Every public page and route reads through these helpers. They replace the
// old build-time `import ... from "@/content/*.json"`: content now lives in D1
// and is fetched per request (pages that use these are rendered dynamically).
import "server-only";
import { readSection, readSingleton } from "./db";
import { DEFAULT_NAV, resolveNavItem } from "./data";
import type {
  Affiliation,
  Book,
  Category,
  Chapter,
  CustomPage,
  InProgress,
  Interview,
  NavItem,
  NavLink,
  Opinion,
  PagesMap,
  Paper,
  Policy,
  Post,
  Seo,
  Site,
  SiteRaw,
} from "./data";

// Sensible fallbacks so the site still renders (and metadata resolves) before
// the database has been seeded.
const DEFAULT_SITE: SiteRaw = {
  name: "Zunera",
  role: "",
  tagline: "",
  bio: "",
  portrait: "/portrait.webp",
  interests: [],
  emailAcademic: "",
  emailPersonal: "",
  twitter: "",
  linkedin: "",
};

const DEFAULT_SEO: Seo = {
  defaultTitle: "Zunera",
  brandName: "Zunera",
  description: "",
  ogImage: "/portrait.webp",
  keywords: [],
  googleVerification: "",
};

export async function getAffiliations(): Promise<Affiliation[]> {
  return readSection<Affiliation>("affiliations");
}

export async function getSite(): Promise<Site> {
  const [s, affiliations] = await Promise.all([
    readSingleton<SiteRaw>("site", DEFAULT_SITE),
    getAffiliations(),
  ]);
  return {
    name: s.name,
    role: s.role,
    tagline: s.tagline,
    bio: s.bio,
    portrait: s.portrait || "/portrait.webp",
    interests: s.interests ?? [],
    affiliations,
    email: { academic: s.emailAcademic, personal: s.emailPersonal },
    socials: { twitter: s.twitter, linkedin: s.linkedin },
  };
}

export async function getSeo(): Promise<Seo> {
  return readSingleton<Seo>("seo", DEFAULT_SEO);
}

export async function getPages(): Promise<PagesMap> {
  return readSingleton<PagesMap>("pages", {});
}

/** All custom pages (published and drafts), in admin order. */
export async function getCustomPages(): Promise<CustomPage[]> {
  return readSection<CustomPage>("custom-pages");
}

/** A single published custom page by slug, or null. */
export async function getCustomPage(slug: string): Promise<CustomPage | null> {
  const pages = await getCustomPages();
  return pages.find((p) => p.slug === slug && p.published) ?? null;
}

/** The main menu, in order. Falls back to the default menu before seeding. */
export async function getNav(): Promise<NavLink[]> {
  const items = await readSection<NavItem>("nav");
  const source = items.length ? items : DEFAULT_NAV;
  return source
    .map(resolveNavItem)
    .filter((l): l is NavLink => l !== null);
}

export async function isComingSoon(slug: string): Promise<boolean> {
  const pages = await getPages();
  return Boolean(pages[slug]);
}

export async function getBooks(): Promise<Book[]> {
  return readSection<Book>("books");
}

export async function getPapers(): Promise<Paper[]> {
  const papers = await readSection<Omit<Paper, "coAuthors"> & { coAuthors?: string }>(
    "papers"
  );
  return papers.map((p) => ({ ...p, coAuthors: p.coAuthors || null }));
}

export async function getChapters(): Promise<Chapter[]> {
  const chapters = await readSection<Omit<Chapter, "editors"> & { editors?: string }>(
    "chapters"
  );
  return chapters.map((c) => ({ ...c, editors: c.editors || null }));
}

export async function getInProgress(): Promise<InProgress[]> {
  return readSection<InProgress>("in-progress");
}

export async function getOpinions(): Promise<Opinion[]> {
  return readSection<Opinion>("opinions");
}

export async function getInterviews(): Promise<Interview[]> {
  return readSection<Interview>("interviews");
}

export async function getPolicy(): Promise<Policy[]> {
  const policy = await readSection<Omit<Policy, "date"> & { date?: string }>("policy");
  return policy.map((p) => ({ ...p, date: p.date || null }));
}

export async function getCategories(): Promise<Category[]> {
  return readSection<Category>("categories");
}

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await readSection<Post>("posts");
  return posts
    .filter((p) => p.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
