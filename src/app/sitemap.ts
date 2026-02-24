// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const SITE = "https://thecuriousempire.com";

// তোমার api.js এর মতই fallback
const PROD_FALLBACK = "https://api.thecuriousempire.com";

function pickApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE ||
    (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:5000");

  return String(raw || "").replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = pickApiBase();

  // ✅ static pages
  const items: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/shop`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/cart`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ];

  // ✅ products
  try {
    const res = await fetch(`${base}/api/products`, { cache: "no-store" });
    const data = await res.json();

    const products = Array.isArray(data?.products) ? data.products : [];

    for (const p of products) {
      const id = p?._id;
      if (!id) continue;

      const last =
        p?.updatedAt || p?.createdAt ? new Date(p.updatedAt || p.createdAt) : new Date();

      items.push({
        url: `${SITE}/product/${id}`,
        lastModified: last,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // backend down হলেও sitemap ভাঙবে না
  }

  return items;
}