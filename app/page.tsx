import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Newspaper, Landmark } from "lucide-react";
import { site, books, papers, opinions, interviews, policy, chapters } from "@/lib/data";
import { HeroText, Reveal, StaggerList, StaggerItem } from "@/components/motion";

const stats = [
  { label: "Books", value: books.length, href: "/books", icon: BookOpen },
  { label: "Peer-reviewed papers", value: papers.length, href: "/papers", icon: FileText },
  { label: "Commentary & media", value: opinions.length + interviews.length, href: "/commentary", icon: Newspaper },
  { label: "Policy publications", value: policy.length, href: "/policy", icon: Landmark },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_10%,#f0e2d9_0%,transparent_70%)]"
        />
        <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-20 sm:pt-28 pb-16 sm:pb-24 grid lg:grid-cols-[1fr_minmax(280px,360px)] gap-12 lg:gap-16 items-center">
          <div>
            <HeroText>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
                {site.role}
              </p>
            </HeroText>
            <HeroText delay={0.1}>
              <h1 className="mt-5 font-serif text-5xl sm:text-6xl lg:text-[4.25rem] tracking-tight leading-[1.05]">
                Policing, security &amp; social order in the{" "}
                <span className="text-accent italic">Global South</span>
              </h1>
            </HeroText>
            <HeroText delay={0.2}>
              <p className="mt-7 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
                {site.bio}
              </p>
            </HeroText>
            <HeroText delay={0.3}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/books"
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium transition-all duration-300 hover:bg-accent hover:gap-3"
                >
                  Explore my research <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-medium text-ink-soft transition-all duration-300 hover:border-accent hover:text-accent"
                >
                  Get in touch
                </Link>
              </div>
            </HeroText>
            <HeroText delay={0.4}>
              <ul className="mt-12 flex flex-wrap gap-2">
                {site.interests.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-paper-soft border border-line px-4 py-1.5 text-xs text-ink-soft"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </HeroText>
          </div>

          <HeroText delay={0.25} className="order-first lg:order-none">
            <div className="relative mx-auto max-w-[280px] sm:max-w-[340px] lg:max-w-none">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[2rem] bg-accent-soft rotate-3 transition-transform duration-500"
              />
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[2rem] border border-accent/25 -rotate-2"
              />
              <Image
                src={site.portrait}
                alt={`Portrait of ${site.name}`}
                width={720}
                height={900}
                priority
                className="relative rounded-[1.75rem] object-cover shadow-[0_20px_50px_rgba(33,31,26,0.15)]"
              />
            </div>
          </HeroText>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8">
        <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <Link
                href={s.href}
                className="group block rounded-2xl border border-line bg-white/60 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
              >
                <s.icon size={20} className="text-accent" />
                <p className="mt-4 font-serif text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-ink-soft group-hover:text-ink transition-colors">
                  {s.label}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      {/* Featured book */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 mt-24">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
            Featured book
          </p>
        </Reveal>
        <div className="mt-6 rounded-3xl border border-line bg-paper-soft/70 p-8 sm:p-12">
          <Reveal delay={0.05}>
            <h2 className="font-serif text-3xl sm:text-4xl leading-tight max-w-2xl">
              {books[0].title}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-sm text-accent font-medium">
              {books[0].publisher} · {books[0].year}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 text-ink-soft leading-relaxed max-w-2xl">
              {books[0].description}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-7 flex flex-wrap gap-4">
              <a
                href={books[0].href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-accent text-paper px-6 py-3 text-sm font-medium transition-all duration-300 hover:bg-accent-deep hover:gap-3"
              >
                View the book <ArrowUpRight size={16} />
              </a>
              <Link
                href="/books"
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-medium text-ink-soft hover:text-accent transition-colors"
              >
                All book projects <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Recent work */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 mt-24">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl sm:text-4xl">Recent work</h2>
            <Link
              href="/papers"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-accent transition-colors shrink-0"
            >
              All papers <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <StaggerList className="mt-8 grid gap-4">
          {papers.slice(0, 3).map((p) => (
            <StaggerItem key={p.title}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-6 rounded-2xl border border-line bg-white/60 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
              >
                <span className="font-serif text-accent shrink-0">{p.year}</span>
                <div>
                  <h3 className="font-serif text-lg leading-snug group-hover:text-accent-deep transition-colors">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-soft italic">
                    {p.journal}
                    {p.coAuthors ? ` · ${p.coAuthors}` : ""}
                  </p>
                </div>
                <ArrowUpRight
                  size={18}
                  className="ml-auto shrink-0 text-line group-hover:text-accent transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </StaggerItem>
          ))}
        </StaggerList>
        <Reveal className="sm:hidden mt-6">
          <Link
            href="/papers"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent"
          >
            All papers <ArrowRight size={15} />
          </Link>
        </Reveal>
      </section>

      {/* Affiliations */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 mt-24">
        <Reveal>
          <h2 className="font-serif text-3xl sm:text-4xl">Affiliations</h2>
        </Reveal>
        <StaggerList className="mt-8 grid sm:grid-cols-3 gap-4">
          {site.affiliations.map((a) => (
            <StaggerItem key={a.label}>
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full rounded-2xl border border-line bg-white/60 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
              >
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-accent">
                  {a.detail}
                </p>
                <p className="mt-3 font-serif text-lg leading-snug group-hover:text-accent-deep transition-colors">
                  {a.label}
                </p>
              </a>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>

      {/* Chapters teaser */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 mt-24">
        <Reveal>
          <div className="rounded-3xl bg-ink text-paper p-8 sm:p-12 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_20%,rgba(154,74,42,0.35)_0%,transparent_70%)]"
            />
            <div className="relative">
              <h2 className="font-serif text-3xl sm:text-4xl max-w-xl leading-tight">
                Book chapters, commentary &amp; policy writing
              </h2>
              <p className="mt-4 text-paper/70 max-w-xl leading-relaxed">
                {chapters.length} book chapters, {opinions.length} opinion pieces,{" "}
                {interviews.length} media interviews and {policy.length} policy
                publications, spanning DAWN, The New York Times, BBC, the
                Carnegie Endowment and more.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/commentary"
                  className="inline-flex items-center gap-2 rounded-full bg-paper text-ink px-6 py-3 text-sm font-medium transition-all duration-300 hover:bg-accent hover:text-paper hover:gap-3"
                >
                  Read commentary <ArrowRight size={16} />
                </Link>
                <Link
                  href="/policy"
                  className="inline-flex items-center gap-2 rounded-full border border-paper/30 px-6 py-3 text-sm font-medium text-paper/90 transition-all duration-300 hover:border-paper hover:gap-3"
                >
                  Policy work <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
