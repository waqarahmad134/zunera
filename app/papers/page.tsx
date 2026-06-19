import type { Metadata } from "next";
import { papers, isComingSoon } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import PubCard from "@/components/PubCard";
import { StaggerList, StaggerItem } from "@/components/motion";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  alternates: { canonical: "/papers" },
  title: "Papers",
  description: "Peer-reviewed journal articles by Zunera.",
};

export default function PapersPage() {
  if (isComingSoon("papers")) return <ComingSoon title="Papers" />;

  return (
    <>
      <PageHeader
        eyebrow="Peer-reviewed"
        title="Papers"
        description="Journal articles published in Security Dialogue, World Development, Policing and Society and other leading venues."
      />
      <StaggerList className="mx-auto max-w-6xl px-5 sm:px-8 grid gap-4">
        {papers.map((p) => (
          <StaggerItem key={p.title}>
            <PubCard
              year={p.year}
              title={p.title}
              sub={p.coAuthors}
              meta={p.journal}
              href={p.href}
            />
          </StaggerItem>
        ))}
      </StaggerList>
    </>
  );
}
