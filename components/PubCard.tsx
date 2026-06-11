import { ArrowUpRight } from "lucide-react";

export default function PubCard({
  year,
  title,
  meta,
  sub,
  href,
}: {
  year: string | number;
  title: string;
  meta: string;
  sub?: string | null;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex gap-5 sm:gap-8 rounded-2xl border border-line bg-white/60 p-6 sm:p-7 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
    >
      <span className="font-serif text-sm sm:text-base text-accent pt-0.5 shrink-0 w-12">
        {year}
      </span>
      <div className="min-w-0">
        <h3 className="font-serif text-lg sm:text-xl leading-snug group-hover:text-accent-deep transition-colors">
          {title}
        </h3>
        {sub && <p className="mt-1.5 text-sm text-ink-soft">{sub}</p>}
        <p className="mt-2 text-sm text-ink-soft italic">{meta}</p>
      </div>
      <ArrowUpRight
        size={18}
        className="ml-auto shrink-0 text-line group-hover:text-accent transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </a>
  );
}
