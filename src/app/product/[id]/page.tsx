// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  const base =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE || // fallback (যদি API_BASE না থাকে)
    "https://api.thecuriousempire.com";

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

  const url = `https://thecuriousempire.com/product/${params.id}`;

  if (!p) {
    return {
      title: "Product not found", // ✅ এখানে আর suffix দিও না (RootLayout template দিবে)
      description: "This product is not available.",
      alternates: { canonical: url },
    };
  }

  const title = String(p.title || "Product");
  const desc = String(p.description || "")
    .replace(/\s+/g, " ")
    .slice(0, 160);

  const image =
    (Array.isArray(p.images) && p.images[0]) ? p.images[0] : "/logo.png";

  return {
    title, // ✅ শুধু title, template auto suffix দিবে
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "The Curious Empire",
      images: [{ url: image }],
      type: "product", // ✅ product better
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