import type { Metadata, Viewport } from "next";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Jubilee Water — Admin",
    template: "%s | Jubilee Water Admin",
  },
  description: "Order management for Jubilee Water bottle delivery.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jubilee Water",
  },
};

export const viewport: Viewport = {
  themeColor: "#2a78d6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-paper text-ink">
        <ServiceWorkerRegistration />
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
