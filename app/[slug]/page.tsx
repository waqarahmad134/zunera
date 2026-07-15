import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomPage } from "@/lib/content";
import { RESERVED_SLUGS } from "@/lib/data";
import { HeroText } from "@/components/motion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCustomPage(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.metaDescription || undefined,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { type: "article", title: page.title, description: page.metaDescription },
  };
}

export default async function CustomPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Built-in routes have their own files and win over this catch-all, but guard
  // defensively so a reserved slug never renders a custom page.
  if (RESERVED_SLUGS.includes(slug)) notFound();

  const page = await getCustomPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-8 pt-16 sm:pt-24">
      <HeroText>
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight leading-[1.1]">
          {page.title}
        </h1>
      </HeroText>
      <HeroText delay={0.1}>
        <div
          className="prose-z mt-8"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </HeroText>
    </article>
  );
}
