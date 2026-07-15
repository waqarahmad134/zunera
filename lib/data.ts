// Client-safe content types and static navigation.
//
// This module must stay free of any server-only imports (D1, R2, the
// Cloudflare context) because client components such as Nav and Footer import
// types and constants from here. The actual data fetching lives in
// lib/content.ts and is server-only. Types are erased at build time, so
// sharing them is safe.

export interface Affiliation {
  label: string;
  detail: string;
  href: string;
}

/** Shape of the `site` singleton row as stored in D1. */
export interface SiteRaw {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  portrait?: string;
  interests: string[];
  emailAcademic: string;
  emailPersonal: string;
  twitter: string;
  linkedin: string;
}

/** Composed site object consumed by the UI. */
export interface Site {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  portrait: string;
  interests: string[];
  affiliations: Affiliation[];
  email: { academic: string; personal: string };
  socials: { twitter: string; linkedin: string };
}

export interface Seo {
  defaultTitle: string;
  brandName: string;
  description: string;
  ogImage: string;
  keywords: string[];
  googleVerification: string;
}

export type PagesMap = Record<string, boolean>;

export interface Paper {
  year: number;
  title: string;
  coAuthors: string | null;
  journal: string;
  href: string;
}

export interface Opinion {
  year: number;
  date: string;
  title: string;
  outlet: string;
  href: string;
}

export interface Interview {
  year: number;
  date: string;
  title: string;
  outlet: string;
  href: string;
}

export interface Category {
  name: string;
  slug: string;
}

export interface Post {
  title: string;
  slug: string;
  date: string;
  category: string;
  image?: string;
  excerpt: string;
  content: string;
  published: boolean;
}

// Known internal destinations a menu item can link to. Every page stays
// available to connect to here even if it is removed from the live menu.
export const SITE_PAGES: { label: string; path: string }[] = [
  { label: "Home", path: "/" },
  { label: "Papers", path: "/papers" },
  { label: "Commentary", path: "/commentary" },
  { label: "Blog", path: "/blog" },
  { label: "CV", path: "/cv" },
  { label: "Contact", path: "/contact" },
];

/** A standalone page (About, Privacy Policy, Terms, …) created in the admin. */
export interface CustomPage {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  published: boolean;
}

// Slugs that already belong to built-in routes; a custom page must not use
// these (the built-in route would shadow it).
export const RESERVED_SLUGS = [
  "", "admin", "api", "uploads", "papers",
  "commentary", "blog", "cv", "contact",
  "sitemap.xml", "robots.txt", "llms.txt", "icon.svg", "favicon.ico",
];

/** A single menu entry as stored in the `nav` section. */
export interface NavItem {
  label: string;
  /**
   * "page" links to a built-in SITE_PAGES path; "custom-page" links to a
   * custom page by slug; "custom" links to any URL.
   */
  kind: "page" | "custom-page" | "custom";
  page: string;
  /** Slug of a custom page, when kind === "custom-page". */
  pageSlug?: string;
  url: string;
  /** When false, the item is hidden from the live menu. Undefined = active. */
  active?: boolean;
}

/** A resolved menu entry consumed by the Nav/Footer UI. */
export interface NavLink {
  label: string;
  href: string;
  external: boolean;
}

/** Default menu, used to seed the DB and as a fallback before it is seeded. */
export const DEFAULT_NAV: NavItem[] = [
  { label: "Papers", kind: "page", page: "/papers", url: "" },
  { label: "Commentary", kind: "page", page: "/commentary", url: "" },
  { label: "Blog", kind: "page", page: "/blog", url: "" },
  { label: "CV", kind: "page", page: "/cv", url: "" },
  { label: "Contact", kind: "page", page: "/contact", url: "" },
];

/** Resolve a stored nav item into a usable link. */
export function resolveNavItem(item: NavItem): NavLink | null {
  if (item.active === false) return null;
  let href = "";
  let external = false;
  if (item.kind === "custom") {
    href = item.url;
    external = /^https?:\/\//i.test(href);
  } else if (item.kind === "custom-page") {
    href = item.pageSlug ? `/${item.pageSlug}` : "";
  } else {
    href = item.page;
  }
  if (!item.label || !href) return null;
  return { label: item.label, href, external };
}
