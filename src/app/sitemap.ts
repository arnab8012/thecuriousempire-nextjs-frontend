// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://thecuriousempire.com";

function pickBaseUrl() {
  const base =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";
  return String(base).replace(/\/+$/, "");
}

async function getAllProducts(base: string) {
  // Robust fetch: supports many backend response shapes + pagination if available
  const all: any[] = [];

  // Try page-based fetching (if backend supports)
  for (let page = 1; page <= 50; page++) {
    const url = `${base}/api/products?page=${page}&limit=200`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;

    const data = await res.json();

    const arr =
      data?.products ||
      data?.items ||
      data?.data?.products ||
      data?.data?.items ||
      (Array.isArray(data) ? data : []) ||
      [];

    if (!Array.isArray(arr) || arr.length === 0) break;

    all.push(...arr);

    const totalPages = data?.totalPages || data?.pagination?.totalPages;
    if (totalPages && page >= totalPages) break;

    // If backend isn't paginated, stop after first successful bulk
    if (!data?.totalPages && !data?.pagination?.totalPages) break;
  }

  // Fallback (if pagination endpoint didn't work)
  if (all.length === 0) {
    const res = await fetch(`${base}/api/products`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const arr =
        data?.products ||
        data?.items ||
        data?.data?.products ||
        data?.data?.items ||
        (Array.isArray(data) ? data : []);
      if (Array.isArray(arr)) all.push(...arr);
    }
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = pickBaseUrl();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: new Date() },
    { url: `${SITE}/shop`, lastModified: new Date() },
    { url: `${SITE}/cart`, lastModified: new Date() },
    { url: `${SITE}/login`, lastModified: new Date() },
  ];

  if (!base) return staticUrls;

  try {
    const products = await getAllProducts(base);

    const productUrls: MetadataRoute.Sitemap = products
      .map((p: any) => {
        const id = p?._id || p?.id;
        if (!id) return null;
        const updated = p?.updatedAt || p?.createdAt || null;

        return {
          url: `${SITE}/product/${id}`,
          lastModified: updated ? new Date(updated) : new Date(),
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;

    return [...staticUrls, ...productUrls];
  } catch {
    return staticUrls;
  }
}