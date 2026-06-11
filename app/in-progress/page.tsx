import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { inProgress } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import { StaggerList, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  alternates: { canonical: "/in-progress" },
  title: "In Progress",
  description: "Ongoing research projects by Zunera.",
};

export default function InProgressPage() {
  return (
    <>
      <PageHeader
        eyebrow="Current research"
        title="In Progress"
        description="Ongoing and collaborative projects on policing, technology, cybercrime and urban insecurity."
      />
      <StaggerList className="mx-auto max-w-6xl px-5 sm:px-8 grid sm:grid-cols-2 gap-4">
        {inProgress.map((p) => (
          <StaggerItem key={p.title} className="h-full">
            <div className="group h-full rounded-2xl border border-line bg-white/60 p-7 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5">
              <FlaskConical size={20} className="text-accent" />
              <h2 className="mt-4 font-serif text-xl leading-snug group-hover:text-accent-deep transition-colors">
                {p.title}
              </h2>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                {p.description}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </>
  );
}
