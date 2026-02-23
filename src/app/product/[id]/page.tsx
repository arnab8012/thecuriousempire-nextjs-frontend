import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const id = params.id;

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL;

  if (!base) {
    return {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience",
    };
  }

  try {
    const res = await fetch(`${base}/api/products/${id}`, { cache: "no-store" });

    if (!res.ok) {
      return {
        title: "Product | The Curious Empire",
        description: "Premium Shopping Experience",
      };
    }

    const data = await res.json();
    const p = data?.product ?? data;

    const title = p?.title
      ? `${p.title} | The Curious Empire`
      : "Product | The Curious Empire";

    const desc =
      (typeof p?.description === "string" && p.description.replace(/\s+/g, " ").trim().slice(0, 180)) ||
      "Premium Shopping Experience — Unique products delivered with quality & care.";

    // ✅ image absolute url (social share ঠিক করার জন্য)
    const firstImg =
      (Array.isArray(p?.images) && p.images[0]) ||
      p?.image ||
      "https://thecuriousempire.com/logo.png";

    const ogImg = String(firstImg).startsWith("http")
      ? firstImg
      : `https://thecuriousempire.com${firstImg.startsWith("/") ? "" : "/"}${firstImg}`;

    const url = `https://thecuriousempire.com/product/${id}`;

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
    return {
      title: "Product | The Curious Empire",
      description: "Premium Shopping Experience",
    };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}