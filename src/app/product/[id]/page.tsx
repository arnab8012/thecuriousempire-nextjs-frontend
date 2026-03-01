// src/app/product/[id]/page.tsx
import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

function getBase() {
  // ✅ hidden whitespace / zero-width char avoid
  return (process.env.API_BASE || "").trim().replace(/\/+$/, "");
}

async function getProduct(id: string) {
  const base = getBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/api/products/${id}`, {
      // ✅ Next cache control
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.ok ? data.product : null;
  } catch {
    // ✅ never crash server render
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
    };
  }

  const title = `${p.title} | The Curious Empire`;
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const image =
    Array.isArray(p.images) && p.images[0] ? p.images[0] : "https://thecuriousempire.com/logo.png";

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