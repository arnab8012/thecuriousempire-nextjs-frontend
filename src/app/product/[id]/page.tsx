import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;
  const base =
    process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL; // ✅ দুটোই ধরলাম

  if (!base) {
    return { title: "Product | The Curious Empire", description: "Premium Shopping Experience" };
  }

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return { title: "Product | The Curious Empire", description: "Premium Shopping Experience" };

    const data = await res.json();
    const p = data?.product ?? data;

    const title = p?.name ? `${p.name} | The Curious Empire` : "Product | The Curious Empire";
    const desc =
      p?.description?.slice?.(0, 160) ||
      "Premium Shopping Experience — Unique products delivered with quality & care.";
    const img = (Array.isArray(p?.images) && p.images[0]) || p?.image || "/logo.png";

    return {
      title,
      description: desc,
      openGraph: { title, description: desc, images: [{ url: img }] },
      twitter: { card: "summary_large_image", title, description: desc, images: [img] },
    };
  } catch {
    return { title: "Product | The Curious Empire", description: "Premium Shopping Experience" };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}