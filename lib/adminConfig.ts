import { SITE_PAGES } from "./data";

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
  /** For selects with a fixed set of choices (instead of optionsFrom). */
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  /** Custom label shown next to a checkbox (overrides the default visible/hidden text). */
  checkboxLabel?: string;
  /** Value used for this field when creating a new item (defaults per type otherwise). */
  defaultValue?: unknown;
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
  /**
   * Field keys shown as columns in the list table, in order. Only used for
   * non-singleton sections; each key must match a `fields[].key`.
   */
  columns?: string[];
  /**
   * A boolean field key that renders as an inline on/off toggle in the list
   * table (a "Status" column). Toggling it saves immediately.
   */
  toggleField?: string;
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
    slug: "pages",
    label: "Page Visibility",
    description:
      "Switch a page to a \"Coming soon\" placeholder until you have content to show there.",
    singleton: true,
    itemTitleKey: "blog",
    fields: [
      { key: "blog", label: "Blog", type: "checkbox", checkboxLabel: "Show \"Coming soon\" instead of the Blog page" },
      { key: "papers", label: "Papers", type: "checkbox", checkboxLabel: "Show \"Coming soon\" instead of the Papers page" },
      { key: "chapters", label: "Book Chapters", type: "checkbox", checkboxLabel: "Show \"Coming soon\" instead of the Chapters page" },
      { key: "in-progress", label: "In Progress", type: "checkbox", checkboxLabel: "Show \"Coming soon\" instead of the In Progress page" },
      { key: "commentary", label: "Commentary", type: "checkbox", checkboxLabel: "Show \"Coming soon\" instead of the Commentary page" },
      { key: "policy", label: "Policy", type: "checkbox", checkboxLabel: "Show \"Coming soon\" instead of the Policy page" },
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
    slug: "nav",
    label: "Navigation Menu",
    description:
      "The main site menu. Reorder with the arrows, toggle items on or off, and link each to a page or a custom URL.",
    itemTitleKey: "label",
    columns: ["label", "kind", "page", "url"],
    toggleField: "active",
    fields: [
      { key: "label", label: "Menu label", type: "text" },
      {
        key: "kind",
        label: "Links to",
        type: "select",
        options: [
          { value: "page", label: "A built-in page" },
          { value: "custom-page", label: "A custom page (About, Terms, …)" },
          { value: "custom", label: "A custom URL" },
        ],
        help: "Pick where this menu item goes.",
      },
      {
        key: "page",
        label: "Built-in page",
        type: "select",
        options: SITE_PAGES.map((p) => ({ value: p.path, label: p.label })),
        help: "Used when \"Links to\" is set to a built-in page.",
      },
      {
        key: "pageSlug",
        label: "Custom page",
        type: "select",
        optionsFrom: "custom-pages",
        optionValue: "slug",
        optionLabel: "title",
        help: "Used when \"Links to\" is set to a custom page.",
      },
      {
        key: "url",
        label: "Custom URL",
        type: "url",
        placeholder: "https://example.com",
        help: "Used when \"Links to\" is set to a custom URL. External links open in a new tab.",
      },
      {
        key: "active",
        label: "Status",
        type: "checkbox",
        checkboxLabel: "Show this item in the menu",
        defaultValue: true,
      },
    ],
  },
  {
    slug: "custom-pages",
    label: "Pages",
    description:
      "Standalone pages like About, Privacy Policy or Terms. Publish one, then link it from the Navigation Menu.",
    itemTitleKey: "title",
    columns: ["title", "slug", "published"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "slug",
        label: "Slug (in the URL)",
        type: "slug",
        help: "The page will live at /your-slug. Use \"cv\" to fill the CV page, or \"books\" for your books page. Avoid other names already used by the site (papers, blog, policy, contact, chapters, commentary, in-progress).",
      },
      {
        key: "content",
        label: "Content",
        type: "richtext",
        help: "Use the toolbar for headings, bold, links, images and lists.",
      },
      {
        key: "metaDescription",
        label: "SEO description (optional)",
        type: "textarea",
        help: "The summary shown in search results. Plain text.",
      },
      { key: "published", label: "Published", type: "checkbox" },
    ],
  },
  {
    slug: "affiliations",
    label: "Affiliations",
    description: "Organisations shown on the homepage.",
    itemTitleKey: "label",
    columns: ["label", "detail", "href"],
    fields: [
      { key: "label", label: "Organisation", type: "text" },
      { key: "detail", label: "Your role there", type: "text" },
      { key: "href", label: "Link", type: "url" },
    ],
  },
  {
    slug: "papers",
    label: "Papers",
    description: "Peer-reviewed journal articles.",
    itemTitleKey: "title",
    columns: ["title", "year", "journal", "coAuthors"],
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
    columns: ["title", "year", "book", "publisher"],
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
    columns: ["title", "description"],
    fields: [
      { key: "title", label: "Title", type: "text" },
      {
        key: "description",
        label: "Description",
        type: "richtext",
        help: "Use the toolbar for bold, italics, links and lists.",
      },
    ],
  },
  {
    slug: "opinions",
    label: "Opinions",
    description: "Op-eds and public writing.",
    itemTitleKey: "title",
    columns: ["title", "outlet", "date", "year"],
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
    columns: ["title", "outlet", "date", "year"],
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
    columns: ["title", "org", "date", "year"],
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
    columns: ["name", "slug"],
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
    columns: ["title", "category", "date", "published"],
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
