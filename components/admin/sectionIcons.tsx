import {
  BookOpen, FileText, Library, FlaskConical, PenLine, Mic, Landmark,
  User, Building2, Tags, Newspaper, Search, EyeOff, Menu, File,
  type LucideIcon,
} from "lucide-react";

export const SECTION_ICONS: Record<string, LucideIcon> = {
  site: User,
  pages: EyeOff,
  seo: Search,
  nav: Menu,
  "custom-pages": File,
  affiliations: Building2,
  books: BookOpen,
  papers: FileText,
  chapters: Library,
  "in-progress": FlaskConical,
  opinions: PenLine,
  interviews: Mic,
  policy: Landmark,
  categories: Tags,
  posts: Newspaper,
};

export function sectionIcon(slug: string): LucideIcon {
  return SECTION_ICONS[slug] ?? FileText;
}
