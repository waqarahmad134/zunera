// Client-safe content types and static navigation.
//
// This module must stay free of any server-only imports (D1, R2, the
// Cloudflare context) because client components such as Nav and Footer import
// `navLinks` from here. The actual data fetching lives in lib/content.ts and is
// server-only. Types are erased at build time, so sharing them is safe.

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

export interface Book {
  title: string;
  year: number;
  publisher: string;
  role: string;
  href: string;
  description: string;
}

export interface Paper {
  year: number;
  title: string;
  coAuthors: string | null;
  journal: string;
  href: string;
}

export interface Chapter {
  year: number;
  title: string;
  book: string;
  editors: string | null;
  publisher: string;
  href: string;
}

export interface InProgress {
  title: string;
  description: string;
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

export interface Policy {
  year: number;
  title: string;
  date: string | null;
  org: string;
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
