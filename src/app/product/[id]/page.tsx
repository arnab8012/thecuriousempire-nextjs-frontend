// src/app/product/[id]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

const SITE = "https://thecuriousempire.com";

function pickBaseUrl() {
  const base =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "";
  return String(base).replace(/\/+$/, "");
}

function cleanText(x: any) {
  return String(x || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchProductServer(id: string) {
  const base = pickBaseUrl();
  if (!base) return null;

  const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  return data?.product ?? data ?? null;
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
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
      siteName: "The Curious Empire",
      images: [
        {
          url: `${SITE}/logo.png`,
          secureUrl: `${SITE}/logo.png`,
          alt: "The Curious Empire",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      images: [`${SITE}/logo.png`],
    },
  };

  try {
    const p = await fetchProductServer(id);
    if (!p) return fallback;

    const title = p?.title
      ? `${p.title} | The Curious Empire`
      : (fallback.title as string);

    const description =
      cleanText(p?.description) ||
      "Premium Shopping Experience — Unique products delivered with quality & care.";
    const desc = description.slice(0, 180);

    const img0 =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      "/logo.png";

    const ogImage = String(img0).startsWith("http")
      ? String(img0)
      : `${SITE}${String(img0).startsWith("/") ? "" : "/"}${img0}`;

    return {
      title,
      description: desc,
      alternates: { canonical },
      openGraph: {
        title,
        description: desc,
        url: canonical,
        type: "product",
        siteName: "The Curious Empire",
        images: [
          {
            url: ogImage,
            secureUrl: ogImage,
            alt: p?.title ? String(p.title) : "The Curious Empire Product",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [ogImage],
      },
      // Extra WhatsApp/Facebook help (Next will render common OG anyway)
      other: {
        "og:image:secure_url": ogImage,
        "og:image:alt": p?.title ? String(p.title) : "Product image",
        "og:site_name": "The Curious Empire",
      },
    };
  } catch {
    return fallback;
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const canonical = `${SITE}/product/${id}`;

  const p = await fetchProductServer(id);

  // Schema.org Product JSON-LD (Google rich results)
  const images: string[] =
    (Array.isArray(p?.images) ? p.images : [])
      .filter(Boolean)
      .map((x: any) =>
        String(x).startsWith("http")
          ? String(x)
          : `${SITE}${String(x).startsWith("/") ? "" : "/"}${x}`
      );

  const price = Number(p?.price || 0);
  const availability =
    p?.stock > 0 || (Array.isArray(p?.variants) && p.variants.some((v: any) => (v?.stock ?? 0) > 0))
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const jsonLd = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: cleanText(p?.title),
        image: images.length ? images : [`${SITE}/logo.png`],
        description: cleanText(p?.description) || cleanText(p?.title),
        sku: String(p?._id || ""),
        brand: { "@type": "Brand", name: "The Curious Empire" },
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "BDT",
          price: isFinite(price) ? String(price) : "0",
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

      {/* Client component */}
      <ProductDetails id={id} />
    </>
  );
}