import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { books } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import { StaggerList, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "Book Projects",
  description: "Books authored and edited by Zunera.",
};

export default function BooksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Book Projects"
        title="Books"
        description="Monographs and edited collections on policing, security and social order in postcolonial contexts."
      />
      <StaggerList className="mx-auto max-w-6xl px-5 sm:px-8 grid gap-6">
        {books.map((b) => (
          <StaggerItem key={b.title}>
            <a
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-3xl border border-line bg-white/60 p-8 sm:p-10 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase text-accent">
                    {b.role} · {b.year}
                  </p>
                  <h2 className="mt-3 font-serif text-2xl sm:text-3xl leading-tight max-w-2xl group-hover:text-accent-deep transition-colors">
                    {b.title}
                  </h2>
                  <p className="mt-2 text-sm text-ink-soft italic">{b.publisher}</p>
                  <p className="mt-5 text-ink-soft leading-relaxed max-w-2xl">
                    {b.description}
                  </p>
                </div>
                <ArrowUpRight
                  size={22}
                  className="shrink-0 text-line group-hover:text-accent transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </div>
            </a>
          </StaggerItem>
        ))}
      </StaggerList>
    </>
  );
}
