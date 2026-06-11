import type { Metadata } from "next";
import { policy } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import PubCard from "@/components/PubCard";
import { StaggerList, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  title: "Policy",
  description:
    "Policy publications by Zunera for Carnegie Endowment, UCL and others.",
};

export default function PolicyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policy engagement"
        title="Policy"
        description="Reports and briefs for the Carnegie Endowment for International Peace, the International Growth Centre, UCL's Jill Dando Institute and The Conversation."
      />
      <StaggerList className="mx-auto max-w-6xl px-5 sm:px-8 grid gap-4">
        {policy.map((p) => (
          <StaggerItem key={p.title}>
            <PubCard
              year={p.year}
              title={p.title}
              sub={p.date}
              meta={p.org}
              href={p.href}
            />
          </StaggerItem>
        ))}
      </StaggerList>
    </>
  );
}
