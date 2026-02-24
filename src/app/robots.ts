// src/app/robots.ts
import type { MetadataRoute } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://thecuriousempire.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api",
          "/api/",
          "/_next/",
          "/checkout",
          "/checkout/",
          "/profile",
          "/profile/",
          "/settings",
          "/settings/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}