// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = (process.env.API_BASE || "").replace(/\/$/, "");
    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      next: { revalidate: 60 },
    });

    const text = await res.text();
    if (!res.ok || !text) return null;

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      return null; // API থেকে JSON না এলে ক্র্যাশ না করে null
    }

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
      title: "Product not found | The Curious Empire",
      description: "This product is not available.",
      alternates: { canonical: url },
      robots: { index: false, follow: true },
    };
  }

  const title = `${p.title} | The Curious Empire`;
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const image =
    Array.isArray(p.images) && p.images[0] ? p.images[0] : "/logo.png";

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