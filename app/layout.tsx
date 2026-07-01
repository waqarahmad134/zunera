import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { getSeo, getSite } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

// Content is read from D1 per request, so the whole app renders dynamically.
export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [seo, site] = await Promise.all([getSeo(), getSite()]);
  const ogImage = seo.ogImage || site.portrait;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: seo.defaultTitle,
      template: `%s | ${seo.brandName}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      type: "website",
      siteName: seo.brandName,
      title: seo.defaultTitle,
      description: seo.description,
      images: [{ url: ogImage, alt: seo.brandName }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.defaultTitle,
      description: seo.description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
    ...(seo.googleVerification
      ? { verification: { google: seo.googleVerification } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#faf8f4",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSite();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}
