import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CommentaryList from "@/components/CommentaryList";
import ComingSoon from "@/components/ComingSoon";
import { getInterviews, getOpinions, isComingSoon } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/commentary" },
  title: "Commentary",
  description:
    "Opinion pieces and media interviews by Zunera in DAWN, The New York Times, BBC, Wired and more.",
};

export default async function CommentaryPage() {
  if (await isComingSoon("commentary")) return <ComingSoon title="Commentary" />;
  const [opinions, interviews] = await Promise.all([
    getOpinions(),
    getInterviews(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Public writing & media"
        title="Commentary"
        description="Opinion pieces, analysis and interviews across outlets including DAWN, The New York Times, BBC and Wired."
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <CommentaryList opinions={opinions} interviews={interviews} />
      </div>
    </>
  );
}
