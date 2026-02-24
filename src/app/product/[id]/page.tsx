import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

const SITE = "https://thecuriousempire.com";
const API = process.env.NEXT_PUBLIC_API_BASE || "https://api.thecuriousempire.com";

function cleanText(x: any) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function absUrl(u: any) {
  const s = String(u || "");
  if (!s) return `${SITE}/logo.png`;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${SITE}${s}`;
  return `${SITE}/${s}`;
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
    const res = await fetch(`${API}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return fallback;

    const data = await res.json();
    const p = data?.product;

    const title = p?.title ? `${cleanText(p.title)} | The Curious Empire` : fallback.title!;
    const description = cleanText(p?.description || p?.title || fallback.description).slice(0, 180);

    const img0 =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      `${SITE}/logo.png`;

    const ogImage = absUrl(img0);

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical, type: "product", images: [{ url: ogImage }] },
      twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    };
  } catch {
    return fallback;
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}