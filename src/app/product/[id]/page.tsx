// src/app/product/[id]/page.tsx

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

const SITE = "https://thecuriousempire.com";
const PROD_FALLBACK = "https://api.thecuriousempire.com";

function pickApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE ||
    (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:5000");

  return String(raw || "").replace(/\/+$/, "");
}

function cleanText(x: any) {
  return String(x ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function absUrl(url: any) {
  const u = String(url || "");
  if (!u) return `${SITE}/logo.png`;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SITE}${u}`;
  return `${SITE}/${u}`;
}

async function fetchProduct(id: string) {
  const base = pickApiBase();

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    const p = data?.product || null;
    if (!p?._id) return null;

    return p;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;
  const canonical = `${SITE}/product/${id}`;

  // ✅ Always-safe fallback (SEO + No crash)
  const fallback: Metadata = {
    title: "Product | The Curious Empire",
    description: "Premium Shopping Experience — Unique products delivered with quality & care.",
    alternates: { canonical },
    openGraph: {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      url: canonical,
      type: "website",
      images: [{ url: `${SITE}/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      images: [`${SITE}/logo.png`],
    },
  };

  const p = await fetchProduct(id);
  if (!p) return fallback;

  const title = p?.title ? `${cleanText(p.title)} | The Curious Empire` : fallback.title!;
  const description = cleanText(p?.description || p?.title || fallback.description).slice(0, 180);

  const firstImage =
    (Array.isArray(p?.images) && p.images.find(Boolean)) ||
    p?.image ||
    `${SITE}/logo.png`;

  const ogImage = absUrl(firstImage);

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

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const canonical = `${SITE}/product/${id}`;

  // ✅ Server tries to fetch (for JSON-LD + initialProduct)
  // ✅ If fails, page still loads (client will fetch)
  const p = await fetchProduct(id);

  // ✅ Server-side JSON-LD (best for Google rich results)
  const images = Array.isArray(p?.images) ? p.images.filter(Boolean).map(absUrl) : [];
  const priceNum = Number(p?.price || 0);

  const availability =
    (p?.variants || []).some((v: any) => Number(v?.stock ?? 0) > 0)
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const jsonLd =
    p
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: cleanText(p?.title),
          image: images.length ? images : [`${SITE}/logo.png`],
          description: cleanText(p?.description || p?.title),
          sku: String(p?._id || ""),
          brand: { "@type": "Brand", name: "The Curious Empire" },
          offers: {
            "@type": "Offer",
            url: canonical,
            priceCurrency: "BDT",
            price: Number.isFinite(priceNum) ? String(priceNum) : "0",
            availability,
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      {/* ✅ Client component: never crashes; API fail হলেও নিজে fetch করবে */}
      <ProductDetails id={id} initialProduct={p || undefined} />
    </>
  );
}