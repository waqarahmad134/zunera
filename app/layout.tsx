import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site } from "@/lib/data";
import { siteUrl } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const DESCRIPTION =
  "Zunera is an Associate Professor at the University of Warwick researching policing, urban insecurity, surveillance and cybercrime in the Global South.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Zunera | Criminologist & Associate Professor",
    template: "%s | Zunera",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Zunera | Criminologist & Associate Professor",
    description: DESCRIPTION,
    images: [{ url: site.portrait, width: 720, height: 900, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zunera | Criminologist & Associate Professor",
    description: DESCRIPTION,
    images: [site.portrait],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
