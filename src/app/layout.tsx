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

  // ✅ (Optional but important) Google/favicon এর জন্য
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Organization JSON-LD (এখানে logo URL change করবে)
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Curious Empire",
    url: "https://thecuriousempire.com",
    logo: "https://thecuriousempire.com/logo.png",
  };

  return (
    <html lang="en">
      <body>
        {/* ✅ Google / SEO এর জন্য Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />

        <Providers>
          <Suspense fallback={null}>
            <LayoutShell>{children}</LayoutShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}