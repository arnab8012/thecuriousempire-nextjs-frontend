// src/app/robots.ts
import type { MetadataRoute } from "next";

const SITE = "https://thecuriousempire.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/product/", "/cart", "/checkout", "/login", "/register"],
        disallow: [
          "/admin",
          "/api",
          "/_next",
          "/favicon.ico",
          "/manifest",
          "/sw.js",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}