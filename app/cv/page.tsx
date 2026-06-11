import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { site } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  alternates: { canonical: "/cv" },
  title: "CV",
  description: "Curriculum vitae of Zunera, available upon request.",
};

export default function CVPage() {
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
