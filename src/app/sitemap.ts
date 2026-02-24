import type { MetadataRoute } from "next";

const SITE = "https://thecuriousempire.com";

function pickBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE ||
    "";
  return String(raw).replace(/\/+$/, "");
}

async function safeListProducts(base: string) {
  const candidates = [
    `${base}/api/products`,
    `${base}/api/products/all`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
      if (!res.ok) continue;

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      const arr =
        data?.products ||
        data?.items ||
        data?.data ||
        (Array.isArray(data) ? data : null);

      if (Array.isArray(arr)) return arr;
    } catch {
      // try next
    }
  }
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = pickBaseUrl();
  const products = base ? await safeListProducts(base) : [];

  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/cart`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  const productUrls: MetadataRoute.Sitemap = products
    .map((p: any) => p?._id || p?.id)
    .filter(Boolean)
    .map((id: string) => ({
      url: `${SITE}/product/${id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticUrls, ...productUrls];
}