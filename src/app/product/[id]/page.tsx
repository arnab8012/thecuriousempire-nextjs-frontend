// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE || "https://api.thecuriousempire.com";

    const res = await fetch(`${base}/api/products/${id}`, {
      // revalidate = 60 এর সাথে এটা রাখাই safe
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("API status:", res.status, text?.slice(0, 120));
      return null;
    }

    if (!text) return null;

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("API returned non-JSON:", text?.slice(0, 200));
      return null;
    }

    return data?.ok ? data.product : null;
  } catch (e) {
    console.error("getProduct error:", e);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const p = await getProduct(params.id);

  if (!p) {
    return {
      title: "Product not found",
      description: "This product is not available.",
      alternates: { canonical: `https://thecuriousempire.com/product/${params.id}` },
    };
  }

  // ❗RootLayout এ template already আছে:
  // template: "%s | The Curious Empire"
  // তাই এখানে আর "| The Curious Empire" যোগ করো না (ডাবল হয়)
  const title = String(p.title || "Product");
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const image =
    Array.isArray(p.images) && p.images[0] ? p.images[0] : "https://thecuriousempire.com/logo.png";
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