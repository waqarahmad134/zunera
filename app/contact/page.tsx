import type { Metadata } from "next";
import { Mail, ArrowUpRight } from "lucide-react";
import { XIcon, LinkedInIcon } from "@/components/icons";
import { site } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import { StaggerList, StaggerItem } from "@/components/motion";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: "Get in touch with Zunera.",
};

const channels = [
  {
    icon: Mail,
    label: "Academic email",
    value: site.email.academic,
    href: `mailto:${site.email.academic}`,
  },
  {
    icon: Mail,
    label: "Personal email",
    value: site.email.personal,
    href: `mailto:${site.email.personal}`,
  },
  {
    icon: XIcon,
    label: "Twitter / X",
    value: "@ZohaWaseem",
    href: site.socials.twitter,
  },
  {
    icon: LinkedInIcon,
    label: "LinkedIn",
    value: "in/zohawaseem",
    href: site.socials.linkedin,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Contact"
        description="For research collaborations, speaking engagements, media enquiries or a copy of my CV."
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <StaggerList className="grid sm:grid-cols-2 gap-4 max-w-3xl">
        {channels.map((c) => (
          <StaggerItem key={c.label}>
            <a
              href={c.href}
              target={c.href.startsWith("mailto") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-line bg-white/60 p-6 transition-all duration-300 hover:border-accent/40 hover:bg-white hover:shadow-[0_8px_30px_rgba(154,74,42,0.08)] hover:-translate-y-0.5"
            >
              <span className="rounded-full bg-accent-soft p-3 text-accent">
                <c.icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold tracking-[0.15em] uppercase text-ink-soft">
                  {c.label}
                </span>
                <span className="mt-1 block text-sm font-medium truncate group-hover:text-accent-deep transition-colors">
                  {c.value}
                </span>
              </span>
              <ArrowUpRight
                size={16}
                className="ml-auto shrink-0 text-line group-hover:text-accent transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </StaggerItem>
        ))}
        </StaggerList>
      </div>
    </>
  );
}
