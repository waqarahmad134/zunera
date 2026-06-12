export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "number"
  | "checkbox"
  | "date"
  | "tags"
  | "select"
  | "slug"
  | "image"
  | "richtext";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  /** For selects: slug of the section whose items provide the options. */
  optionsFrom?: string;
  /** Field of the option items used as value / label. */
  optionValue?: string;
  optionLabel?: string;
  placeholder?: string;
  help?: string;
}

export interface SectionDef {
  slug: string;
  label: string;
  description: string;
  /** Singleton sections are one object instead of a list. */
  singleton?: boolean;
  /** Which field to show as an item's title in list view. */
  itemTitleKey: string;
  fields: Field[];
}

export const SECTIONS: SectionDef[] = [
  {
    slug: "site",
    label: "Profile & Site",
    description: "Name, role, bio, research interests and contact links.",
    singleton: true,
    itemTitleKey: "name",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role / position", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "bio", label: "Bio", type: "textarea" },
      {
        key: "portrait",
        label: "Portrait photo",
        type: "image",
        help: "Shown in the homepage banner.",
      },
      { key: "emailAcademic", label: "Academic email", type: "text" },
      { key: "emailPersonal", label: "Personal email", type: "text" },
      { key: "twitter", label: "Twitter / X URL", type: "url" },
      { key: "linkedin", label: "LinkedIn URL", type: "url" },
      {
        key: "interests",
        label: "Research interests",
        type: "tags",
        help: "Separate with commas.",
      },
    ],
  },
  {
    slug: "seo",
    label: "SEO",
    description: "Search engine titles, description, share image and keywords.",
    singleton: true,
    itemTitleKey: "defaultTitle",
    fields: [
      {
        key: "defaultTitle",
        label: "Site title",
        type: "text",
        help: "Shown in Google results and the browser tab for the homepage.",
      },
      {
        key: "brandName",
        label: "Brand name",
        type: "text",
        help: "Appended to inner page titles, e.g. \"Papers | Brand\".",
      },
      {
        key: "description",
        label: "Site description",
        type: "textarea",
        help: "The summary search engines show under the title. Aim for 150 to 160 characters.",
      },
      {
        key: "ogImage",
        label: "Social share image",
        type: "image",
        help: "Shown when the site is shared on WhatsApp, LinkedIn, X and similar.",
      },
      {
        key: "keywords",
        label: "Keywords",
        type: "tags",
        help: "Separate with commas.",
      },
      {
        key: "googleVerification",
        label: "Google verification code",
        type: "text",
        help: "Optional. The content value from Google Search Console's HTML tag verification.",
      },
    ],
  },
  {
    slug: "affiliations",
    label: "Affiliations",
    description: "Organisations shown on the homepage.",
    itemTitleKey: "label",
    fields: [
      { key: "label", label: "Organisation", type: "text" },
      { key: "detail", label: "Your role there", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "books",
    label: "Books",
    description: "Authored and edited books.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "publisher", label: "Publisher", type: "text" },
      { key: "role", label: "Role (e.g. Author)", type: "text" },
      { key: "href", label: "Link", type: "url" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    slug: "papers",
    label: "Papers",
    description: "Peer-reviewed journal articles.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "coAuthors", label: "Co-authors (optional)", type: "text", placeholder: "with Jane Doe" },
      { key: "journal", label: "Journal", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "chapters",
    label: "Book Chapters",
    description: "Chapters in edited volumes.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "book", label: "Book", type: "text" },
      { key: "editors", label: "Editors (optional)", type: "text" },
      { key: "publisher", label: "Publisher", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "in-progress",
    label: "In Progress",
    description: "Ongoing research projects.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    slug: "opinions",
    label: "Opinions",
    description: "Op-eds and public writing.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "date", label: "Date (e.g. 12 Feb 2023)", type: "text" },
      { key: "outlet", label: "Outlet", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "interviews",
    label: "Interviews",
    description: "Media interviews and appearances.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "date", label: "Date (e.g. 12 Feb 2023)", type: "text" },
      { key: "outlet", label: "Outlet", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "policy",
    label: "Policy",
    description: "Policy reports and briefs.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "year", label: "Year", type: "number" },
      { key: "date", label: "Date (optional)", type: "text" },
      { key: "org", label: "Organisation", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "categories",
    label: "Blog Categories",
    description: "Categories used to group blog posts.",
    itemTitleKey: "name",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "slug", label: "Slug (in the URL)", type: "slug" },
    ],
  },
  {
    slug: "posts",
    label: "Blog Posts",
    description: "Write and publish blog posts.",
    itemTitleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "slug", label: "Slug (in the URL)", type: "slug" },
      { key: "date", label: "Date", type: "date" },
      {
        key: "category",
        label: "Category",
        type: "select",
        optionsFrom: "categories",
        optionValue: "slug",
        optionLabel: "name",
      },
      {
        key: "image",
        label: "Cover image (optional)",
        type: "image",
        help: "Shown on the blog card and at the top of the post.",
      },
      { key: "excerpt", label: "Excerpt (shown in the list)", type: "textarea" },
      {
        key: "content",
        label: "Content",
        type: "richtext",
        help: "Use the toolbar for bold, headings, lists, links and images.",
      },
      { key: "published", label: "Published", type: "checkbox" },
    ],
  },
];

export function getSection(slug: string): SectionDef | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}
