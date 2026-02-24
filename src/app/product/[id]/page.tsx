export const runtime = "nodejs";

import type { Metadata } from "next";
import dynamicImport from "next/dynamic";

// ✅ Client-only ProductDetails (prevents SSR issues)
const ProductDetails = dynamicImport(() => import("@/screens/ProductDetails"), {
  ssr: false,
});

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

function toAbsImageUrl(img: any) {
  const s = String(img || "");
  if (!s) return `${SITE}/logo.png`;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // if backend returns "/uploads/..." or "uploads/..."
  return `${SITE}${s.startsWith("/") ? "" : "/"}${s}`;
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

    if (!p) return fallback;

    const titleBase = p?.title ? cleanText(p.title) : "Product";
    const title = `${titleBase} | The Curious Empire`;

    const description = cleanText(p?.description || p?.title || fallback.description).slice(0, 180);

    const img0 =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      `${SITE}/logo.png`;

    const ogImage = toAbsImageUrl(img0);

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
  } catch {
    // ignore (we will render safe UI)
  }

  // ✅ Schema.org Product JSON-LD (Google rich results)
  const images = Array.isArray(p?.images) ? p.images.filter(Boolean).map(toAbsImageUrl) : [];
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

      {/* ✅ Render client component safely */}
      <ProductDetails id={id} initialProduct={p || undefined} />
    </>
  );
}