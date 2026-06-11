import Link from "next/link";
import { Mail } from "lucide-react";
import { XIcon, LinkedInIcon } from "@/components/icons";
import { site, navLinks } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper-soft/60 mt-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg">Zunera</p>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            {site.role}. {site.tagline}
          </p>
        </div>
        <nav className="text-sm">
          <p className="font-medium mb-3 text-ink">Explore</p>
          <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-ink-soft hover:text-accent transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm">
          <p className="font-medium mb-3 text-ink">Connect</p>
          <ul className="space-y-2">
            <li>
              <a
                href={`mailto:${site.email.academic}`}
                className="inline-flex items-center gap-2 text-ink-soft hover:text-accent transition-colors"
              >
                <Mail size={15} /> {site.email.academic}
              </a>
            </li>
            <li>
              <a
                href={site.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-ink-soft hover:text-accent transition-colors"
              >
                <XIcon size={14} /> @ZohaWaseem
              </a>
            </li>
            <li>
              <a
                href={site.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-ink-soft hover:text-accent transition-colors"
              >
                <LinkedInIcon size={14} /> LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 sm:px-8 py-5 text-xs text-ink-soft">
          © {new Date().getFullYear()} Zunera. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
