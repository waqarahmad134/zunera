import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import BlogList from "@/components/BlogList";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog",
  description:
    "Notes and reflections on policing, urban security and research in the Global South.",
};

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Notes & reflections"
        title="Blog"
        description="Shorter pieces written between the longer projects: fieldwork notes, reading reflections and research updates."
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <BlogList />
      </div>
    </>
  );
}
