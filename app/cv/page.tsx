import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getCustomPage, getSite } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import { HeroText, Reveal } from "@/components/motion";

export const dynamic = "force-dynamic";

// /cv is managed from the admin: create a Page with the slug "cv" and it renders
// here. Until one exists, the "available on request" fallback below is shown, so
// the route and the nav link never break.

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCustomPage("cv");
  return {
    title: page?.title || "CV",
    description: page?.metaDescription || "Curriculum vitae of Zunera.",
    alternates: { canonical: "/cv" },
  };
}

export default async function CVPage() {
  const page = await getCustomPage("cv");

  if (page) {
    return (
      <>
        <PageHeader title={page.title || "CV"} />
        <section className="mx-auto max-w-6xl px-5 sm:px-8 pb-8">
          <HeroText delay={0.1}>
            <div
              className="prose-z max-w-3xl"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </HeroText>
        </section>
      </>
    );
  }

  // Fallback: no CV page has been created yet.
  const site = await getSite();
  return (
    <>
      <PageHeader
        eyebrow="Curriculum Vitae"
        title="CV"
        description="A full curriculum vitae is available upon request."
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="rounded-3xl border border-line bg-paper-soft/70 p-8 sm:p-12 max-w-2xl">
            <p className="text-ink-soft leading-relaxed">
              For a copy of my CV, including positions, education, grants and
              the full list of publications, please get in touch by email.
            </p>
            <a
              href={`mailto:${site.email.personal}`}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium transition-all duration-300 hover:bg-accent hover:gap-3"
            >
              <Mail size={16} /> {site.email.personal}
            </a>
          </div>
        </Reveal>
      </div>
    </>
  );
}
