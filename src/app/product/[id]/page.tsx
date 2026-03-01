// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  const base = process.env.API_BASE;
  if (!base) return null;

  const res = await fetch(`${base}/api/products/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.ok ? data.product : null;
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const p = await getProduct(params.id);

  if (!p) {
    return {
      title: "Product not found | The Curious Empire",
      description: "This product is not available.",
    };
  }

  const title = `${p.title} | The Curious Empire`;
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const image = Array.isArray(p.images) && p.images[0] ? p.images[0] : "/logo.png";
  const url = `https://thecuriousempire.com/product/${params.id}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "The Curious Empire",
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [image],
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <div className="container" style={{ padding: 20 }}>
        Product not found
      </div>
    );
  }

  return <ProductDetails id={params.id} product={product} />;
}