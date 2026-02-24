export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

function pickBaseUrl() {
  // ✅ backend base url (no trailing slash recommended)
  return (
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE || // optional
    ""
  ).replace(/\/+$/, "");
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;

  const site = "https://thecuriousempire.com";
  const canonical = `${site}/product/${id}`;

  const base = pickBaseUrl();

  // ✅ fallback (backend/env problem হলেও product page ভাঙবে না)
  const fallback: Metadata = {
    title: "Product | The Curious Empire",
    description: "Premium Shopping Experience — Unique products delivered with quality & care.",
    alternates: { canonical },
    openGraph: {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      url: canonical,
      type: "product",
      images: [{ url: `${site}/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      images: [`${site}/logo.png`],
    },
  };

  if (!base) return fallback;

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return fallback;

    const data = await res.json();
    const p = data?.product ?? data;

    const title = p?.title
      ? `${p.title} | The Curious Empire`
      : fallback.title!;

    const descRaw =
      typeof p?.description === "string"
        ? p.description
        : "Premium Shopping Experience — Unique products delivered with quality & care.";

    const description = String(descRaw).replace(/\s+/g, " ").trim().slice(0, 180);

    const img0 =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      "/logo.png";

    const ogImage = String(img0).startsWith("http")
      ? String(img0)
      : `${site}${String(img0).startsWith("/") ? "" : "/"}${img0}`;

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

export default function Page({ params }: { params: { id: string } }) {
  // ✅ client component কে id pass করা হচ্ছে
  return <ProductDetails id={params.id} />;
}