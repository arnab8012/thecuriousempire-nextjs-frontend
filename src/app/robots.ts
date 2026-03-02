import type { MetadataRoute } from "next";

const SITE = "https://thecuriousempire.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/admin", "/api", "/_next", "/settings", "/checkout"],
        allow: ["/"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}