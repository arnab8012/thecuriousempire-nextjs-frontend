// src/app/product/[id]/page.tsx
import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE;
    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.ok ? data.product : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const p = await getProduct(params.id);

  const url = `https://thecuriousempire.com/product/${params.id}`;

  if (!p) {
    return {
      title: "Product not found",
      description: "Product not found",
      alternates: { canonical: url },
      robots: { index: false, follow: true },
    };
  }

  const title = p.title || "Product";
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const img = p?.images?.[0] || p?.image || "/logo.png";

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "The Curious Empire",
      images: [{ url: img }],
      type: "product",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [img],
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return <div className="container" style={{ padding: 20 }}>Product not found</div>;
  }

  return <ProductDetails id={params.id} product={product} />;
}