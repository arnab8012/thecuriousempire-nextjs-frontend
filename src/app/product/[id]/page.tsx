import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

const SITE = "https://thecuriousempire.com";
const API_FALLBACK = "https://api.thecuriousempire.com";

function pickApiBase() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE ||
    API_FALLBACK;

  return String(raw || "").replace(/\/+$/, "");
}

function cleanText(x: any) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function normalizeImage(x: any) {
  // API থেকে image string বা object দুইটাই আসতে পারে
  const v =
    typeof x === "string"
      ? x
      : x?.url || x?.secure_url || x?.src || x?.path || "";

  const s = String(v || "");
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

  // ✅ default fallback — কোনো অবস্থাতেই ভাঙবে না
  const fallback: Metadata = {
    title: "Product | The Curious Empire",
    description:
      "Premium Shopping Experience — Unique products delivered with quality & care.",
    alternates: { canonical },
    openGraph: {
      title: "Product | The Curious Empire",
      description:
        "Premium Shopping Experience — Unique products delivered with quality & care.",
      url: canonical,
      type: "website",
      images: [{ url: `${SITE}/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Product | The Curious Empire",
      description:
        "Premium Shopping Experience — Unique products delivered with quality & care.",
      images: [`${SITE}/logo.png`],
    },
  };

  try {
    const base = pickApiBase();

    // ✅ timeout যোগ করলাম যাতে server কখনো হ্যাং না হয়
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 4000);

    const res = await fetch(`${base}/api/products/${id}`, {
      cache: "no-store",
      signal: ac.signal,
    }).finally(() => clearTimeout(t));

    if (!res.ok) return fallback;

    const data = await res.json();
    const p = data?.product;

    const title = p?.title
      ? `${cleanText(p.title)} | The Curious Empire`
      : fallback.title!;

    const description = cleanText(p?.description || p?.title || fallback.description).slice(0, 180);

    const firstImg =
      (Array.isArray(p?.images) ? p.images[0] : null) || p?.image || null;

    const ogImage = normalizeImage(firstImg);

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
  // ✅ শুধু Client UI
  return <ProductDetails id={params.id} />;
}