import "./globals.css";
import Providers from "./providers";
import LayoutShell from "@/components/LayoutShell";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "The Curious Empire",
    template: "%s | The Curious Empire",
  },
  description:
    "Premium Shopping Experience — Unique products delivered with quality & care.",
  metadataBase: new URL("https://thecuriousempire.com"),

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Curious Empire",
    url: "https://thecuriousempire.com",
    logo: "https://thecuriousempire.com/logo.png",
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      </head>
      <body>
        <Providers>
          <Suspense fallback={null}>
            <LayoutShell>{children}</LayoutShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}