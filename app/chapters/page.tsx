import type { Metadata } from "next";
import { chapters, isComingSoon } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import PubCard from "@/components/PubCard";
import { StaggerList, StaggerItem } from "@/components/motion";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  alternates: { canonical: "/chapters" },
  title: "Book Chapters",
  description: "Book chapters contributed by Zunera.",
};

export default function ChaptersPage() {
  if (isComingSoon("chapters")) return <ComingSoon title="Book Chapters" />;

  return (
    <>
      <PageHeader
        eyebrow="Edited volumes"
        title="Book Chapters"
        description="Contributions to edited collections from Springer, Routledge, Bristol University Press and Manchester University Press."
      />
      <StaggerList className="mx-auto max-w-6xl px-5 sm:px-8 grid gap-4">
        {chapters.map((c) => (
          <StaggerItem key={c.title}>
            <PubCard
              year={c.year}
              title={c.title}
              sub={c.editors}
              meta={`In: ${c.book} (${c.publisher})`}
              href={c.href}
            />
          </StaggerItem>
        ))}
      </StaggerList>
    </>
  );
}
