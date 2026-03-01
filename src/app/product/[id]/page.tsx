// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE;
    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const text = await res.text();
    if (!text) return null;

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }

    if (!data?.ok || !data?.product) return null;

    return data.product;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const p = await getProduct(params.id);

    const url = `https://thecuriousempire.com/product/${params.id}`;

    if (!p) {
      return {
        title: "Product not found",
        description: "Product not available.",
        alternates: { canonical: url },
      };
    }

    const title = String(p?.title || "Product");
    const desc = String(p?.description || "")
      .replace(/\s+/g, " ")
      .slice(0, 160);

    const image =
      Array.isArray(p?.images) && p.images.length
        ? p.images[0]
        : "https://thecuriousempire.com/logo.png";

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
        type: "product",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Product",
      description: "Product page",
    };
  }
}

export default async function Page({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <div style={{ padding: 20 }}>
        Product not found
      </div>
    );
  }

  return <ProductDetails id={params.id} product={product} />;
}