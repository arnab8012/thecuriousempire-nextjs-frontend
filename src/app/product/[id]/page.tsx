import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

// ✅ Dynamic SEO for each product
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;

  try {
    // ⚠️ এখানে তোমার backend base url দিতে হবে (.env.local এ)
    // NEXT_PUBLIC_API_URL=https://your-backend-domain.com
    const base = process.env.NEXT_PUBLIC_API_URL;

    if (!base) {
      return {
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience",
      };
    }

    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });

    if (!res.ok) {
      return {
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience",
      };
    }

    const data = await res.json();
    const p = data?.product ?? data;

    const title = p?.name ? `${p.name} | The Curious Empire` : "Product | The Curious Empire";
    const desc =
      (typeof p?.description === "string" && p.description.trim().slice(0, 160)) ||
      "Premium Shopping Experience — Unique products delivered with quality & care.";

    const img =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      "/logo.png";

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
        images: [{ url: img }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [img],
      },
    };
  } catch {
    return {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience",
    };
  }
}

export default function Page() {
  return <ProductDetails />;
}