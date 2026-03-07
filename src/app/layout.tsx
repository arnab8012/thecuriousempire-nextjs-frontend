import "./globals.css";
import Providers from "./providers";
import LayoutShell from "@/components/LayoutShell";
import { Suspense } from "react";
import type { Metadata } from "next";
import Script from "next/script";

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

const META_PIXEL_ID = "1743053860413321";

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

        <Script
          id="meta-pixel-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];
              t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}
              (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        <Providers>
          <Suspense fallback={null}>
            <LayoutShell>{children}</LayoutShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}