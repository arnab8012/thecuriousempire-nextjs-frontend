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
  keywords: [
    "The Curious Empire",
    "Online Shopping Bangladesh",
    "Premium Products",
    "Ecommerce BD",
  ],
  metadataBase: new URL("https://thecuriousempire.com"),

  openGraph: {
    title: "The Curious Empire",
    description:
      "Premium Shopping Experience — Unique products delivered with quality & care.",
    url: "https://thecuriousempire.com",
    siteName: "The Curious Empire",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "The Curious Empire",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "The Curious Empire",
    description:
      "Premium Shopping Experience — Unique products delivered with quality & care.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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