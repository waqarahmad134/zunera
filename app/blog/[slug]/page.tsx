import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { posts, categories, site } from "@/lib/data";
import { HeroText } from "@/components/motion";
import { siteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Post not found" };
  const image = post.image || site.portrait;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [image],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const category = categories.find((c) => c.slug === post.category);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    image: `${siteUrl()}${post.image || site.portrait}`,
    url: `${siteUrl()}/blog/${post.slug}`,
    author: { "@type": "Person", name: site.name, url: siteUrl() },
    ...(category ? { articleSection: category.name } : {}),
  };

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-8 pt-16 sm:pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <HeroText>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-accent transition-colors"
        >
          <ArrowLeft size={15} /> All posts
        </Link>
      </HeroText>
      <HeroText delay={0.08}>
        <div className="mt-6 flex items-center gap-3 text-xs text-ink-soft">
          {category && (
            <span className="rounded-full bg-accent-soft px-3 py-1 font-medium text-accent">
              {category.name}
            </span>
          )}
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </HeroText>
      <HeroText delay={0.14}>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl tracking-tight leading-[1.1]">
          {post.title}
        </h1>
      </HeroText>
      {post.image && (
        <HeroText delay={0.2}>
          <div className="mt-9 overflow-hidden rounded-3xl border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.image} alt="" className="w-full object-cover" />
          </div>
        </HeroText>
      )}
      <HeroText delay={0.22}>
        {/* Content is authored only by the authenticated admin editor. */}
        <div
          className="prose-z mt-9"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </HeroText>
    </article>
  );
}
