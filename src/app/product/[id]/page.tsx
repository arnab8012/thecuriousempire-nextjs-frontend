export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

const SITE = "https://thecuriousempire.com";

function pickBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE ||
    "";
  return String(raw).replace(/\/+$/, "");
}

function cleanText(v: any) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function absUrl(url: string) {
  const u = String(url || "");
  if (!u) return `${SITE}/logo.png`;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SITE}${u}`;
  return `${SITE}/${u}`;
}

async function safeGetProduct(base: string, id: string) {
  try {
    const res = await fetch(`${base}/api/products/${id}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    const p = data?.product ?? data;
    if (!p || !p?._id) return null;
    return p;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  const canonical = `${SITE}/product/${id}`;

  const fallback: Metadata = {
    title: "Product | The Curious Empire",
    description: "Premium Shopping Experience — Unique products delivered with quality & care.",
    alternates: { canonical },
    openGraph: {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      url: canonical,
      type: "product",
      images: [{ url: `${SITE}/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      images: [`${SITE}/logo.png`],
    },
  };

  const base = pickBaseUrl();
  if (!base) return fallback;

  const p = await safeGetProduct(base, id);
  if (!p) return fallback;

  const title = p?.title ? `${cleanText(p.title)} | The Curious Empire` : fallback.title!;
  const description = (cleanText(p?.description) || cleanText(p?.title) || String(fallback.description))
    .slice(0, 180);

  const img0 = (Array.isArray(p?.images) && p.images[0]) || p?.image || "/logo.png";
  const ogImage = absUrl(img0);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "product",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}