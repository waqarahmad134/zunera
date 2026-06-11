import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CommentaryList from "@/components/CommentaryList";

export const metadata: Metadata = {
  title: "Commentary",
  description:
    "Opinion pieces and media interviews by Zunera in DAWN, The New York Times, BBC, Wired and more.",
};

export default function CommentaryPage() {
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
