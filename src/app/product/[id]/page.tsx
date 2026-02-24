export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL;

  const site = "https://thecuriousempire.com";
  const url = `${site}/product/${id}`;

  // base না থাকলে fallback
  if (!base) {
    return {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      alternates: { canonical: url },
      openGraph: {
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience — Unique products delivered with quality & care.",
        url,
        type: "website",
        images: [{ url: `${site}/logo.png` }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience — Unique products delivered with quality & care.",
        images: [`${site}/logo.png`],
      },
    };
  }

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Product fetch failed");

    const data = await res.json();
    const p = data?.product ?? data;

    const title = p?.title
      ? `${p.title} | The Curious Empire`
      : "Product | The Curious Empire";

    const desc =
      (typeof p?.description === "string" &&
        p.description.replace(/\s+/g, " ").trim().slice(0, 180)) ||
      "Premium Shopping Experience — Unique products delivered with quality & care.";

    const firstImg =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      `${site}/logo.png`;

    const ogImg = String(firstImg).startsWith("http")
      ? firstImg
      : `${site}${firstImg.startsWith("/") ? "" : "/"}${firstImg}`;

    return {
      title,
      description: desc,
      alternates: { canonical: url },
      openGraph: {
        title,
        description: desc,
        url,
        type: "product",
        images: [{ url: ogImg }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [ogImg],
      },
    };
  } catch {
    // error হলেও fallback metadata দিবে (server error কমবে)
    return {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience — Unique products delivered with quality & care.",
      alternates: { canonical: url },
      openGraph: {
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience — Unique products delivered with quality & care.",
        url,
        type: "website",
        images: [{ url: `${site}/logo.png` }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience — Unique products delivered with quality & care.",
        images: [`${site}/logo.png`],
      },
    };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}