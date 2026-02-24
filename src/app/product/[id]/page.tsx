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
  return String(x || "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;
  const canonical = `${SITE}/product/${id}`;
  const base = pickApiBase();

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

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return fallback;

    const data = await res.json();
    const p = data?.product;

    const title = p?.title ? `${cleanText(p.title)} | The Curious Empire` : (fallback.title as string);
    const description = cleanText(p?.description || p?.title || fallback.description).slice(0, 180);

    const img0 =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      `${SITE}/logo.png`;

    const ogImage = String(img0).startsWith("http")
      ? String(img0)
      : `${SITE}${String(img0).startsWith("/") ? "" : "/"}${img0}`;

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
  } catch {
    return fallback;
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const base = pickApiBase();
  const canonical = `${SITE}/product/${id}`;

  let p: any = null;

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      p = data?.product || null;
    }
  } catch {}

  const images = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
  const price = Number(p?.price || 0);

  const availability =
    (p?.variants || []).some((v: any) => (v?.stock ?? 0) > 0)
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
            price: Number.isFinite(price) ? String(price) : "0",
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

      {/* ✅ Client Component */}
      <ProductDetails id={id} initialProduct={p || undefined} />
    </>
  );
}