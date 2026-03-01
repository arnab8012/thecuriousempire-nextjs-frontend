// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  const base = process.env.API_BASE;
  if (!base) return null;

  const res = await fetch(`${base}/api/products/${id}`, {
    // ✅ Next recommended caching for revalidate pages
    next: { revalidate },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data?.ok ? data.product : null;
}

// ✅ Emoji-safe truncate (codepoint-wise, slice breaks emoji sometimes)
function safeTruncate(input: unknown, max = 160) {
  const s = String(input ?? "").replace(/\s+/g, " ").trim();
  return Array.from(s).slice(0, max).join("");
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const p = await getProduct(params.id);

  const url = `https://thecuriousempire.com/product/${params.id}`;

  if (!p) {
    return {
      title: "Product not found",
      description: "This product is not available.",
      alternates: { canonical: url },
    };
  }

  // ✅ RootLayout already adds "| The Curious Empire" via template
  const title = String(p.title || "Product");
  const desc = safeTruncate(p.description, 160);

  // ✅ absolute image (best for OG/Twitter)
  const image =
    Array.isArray(p.images) && p.images[0]
      ? String(p.images[0])
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