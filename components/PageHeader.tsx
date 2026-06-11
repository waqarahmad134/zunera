import { HeroText } from "@/components/motion";

export default function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16">
      <HeroText>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
          {eyebrow}
        </p>
      </HeroText>
      <HeroText delay={0.08}>
        <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] max-w-3xl">
          {title}
        </h1>
      </HeroText>
      {description && (
        <HeroText delay={0.16}>
          <p className="mt-6 text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl">
            {description}
          </p>
        </HeroText>
      )}
    </div>
  );
}
