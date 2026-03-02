import type { MetadataRoute } from "next";

const SITE = "https://thecuriousempire.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/admin",
          "/api",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}