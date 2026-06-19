import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { HeroText } from "@/components/motion";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,#f0e2d9_0%,transparent_70%)]"
      />
      <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-28 sm:pt-36 pb-24 text-center">
        <HeroText>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper-soft px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <Clock size={13} /> Coming soon
          </span>
        </HeroText>
        <HeroText delay={0.1}>
          <h1 className="mt-7 font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08]">
            {title}
          </h1>
        </HeroText>
        <HeroText delay={0.18}>
          <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed">
            This section is being prepared and will be available shortly. Please
            check back soon.
          </p>
        </HeroText>
        <HeroText delay={0.26}>
          <Link
            href="/"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-ink text-paper px-6 py-3 text-sm font-medium transition-all duration-300 hover:bg-accent hover:gap-3"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>
        </HeroText>
      </div>
    </section>
  );
}
