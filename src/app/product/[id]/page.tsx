import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

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
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function absFromSiteOrApi(url: any, apiBase: string) {
  const u = String(url || "").trim();
  if (!u) return `${SITE}/logo.png`;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${apiBase}${u}`; // ✅ IMPORTANT: API host
  return `${apiBase}/${u}`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
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

    const title = p?.title ? `${cleanText(p.title)} | The Curious Empire` : (fallback.title as string);
    const description = cleanText(p?.description || p?.title || fallback.description).slice(0, 180);

    const firstImg = (Array.isArray(p?.images) && p.images[0]) || p?.image || "";
    const ogImage = absFromSiteOrApi(firstImg, base);

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
  return <ProductDetails id={params.id} />;
}