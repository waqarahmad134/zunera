import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import BlogList from "@/components/BlogList";
import ComingSoon from "@/components/ComingSoon";
import { getCategories, getPosts, isComingSoon } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog",
  description:
    "Notes and reflections on policing, urban security and research in the Global South.",
};

export default async function BlogPage() {
  if (await isComingSoon("blog")) return <ComingSoon title="Blog" />;
  const [posts, categories] = await Promise.all([getPosts(), getCategories()]);

  return (
    <>
      <PageHeader
        eyebrow="Notes & reflections"
        title="Blog"
        description="Shorter pieces written between the longer projects: fieldwork notes, reading reflections and research updates."
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <BlogList posts={posts} categories={categories} />
      </div>
    </>
  );
}
