import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CommentaryList from "@/components/CommentaryList";
import ComingSoon from "@/components/ComingSoon";
import { isComingSoon } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/commentary" },
  title: "Commentary",
  description:
    "Opinion pieces and media interviews by Zunera in DAWN, The New York Times, BBC, Wired and more.",
};

export default function CommentaryPage() {
  if (isComingSoon("commentary")) return <ComingSoon title="Commentary" />;

  return (
    <>
      <PageHeader
        eyebrow="Public writing & media"
        title="Commentary"
        description="Opinion pieces, analysis and interviews across outlets including DAWN, The New York Times, BBC and Wired."
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <CommentaryList />
      </div>
    </>
  );
}
