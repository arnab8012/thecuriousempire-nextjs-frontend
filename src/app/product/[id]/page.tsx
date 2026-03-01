// src/app/product/[id]/page.tsx
import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  const site = "https://thecuriousempire.com";

  // fallback meta
  if (!BASE) {
    return {
      title: "Product - The Curious Empire",
      description: "Shop premium products from The Curious Empire.",
    };
  }

  try {
    const res = await fetch(`${BASE}/api/products/${params.id}`, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    const p = data?.product || data; // backend shape আলাদা হলেও handle করবে

    if (!p?._id) {
      return {
        title: "Product not found - The Curious Empire",
        robots: { index: false, follow: false },
      };
    }

    const title = `${p.title || "Product"} - The Curious Empire`;

    const description =
      String(p.description || "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 155) || "Shop premium products from The Curious Empire.";

    const url = `${site}/product/${p._id}`;
    const image =
      (Array.isArray(p.images) && p.images[0]) ||
      p.image ||
      p.thumb ||
      "";

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: "website",
        url,
        title,
        description,
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: "Product - The Curious Empire",
      description: "Shop premium products from The Curious Empire.",
    };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}