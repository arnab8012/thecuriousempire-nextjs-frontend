// src/app/product/[id]/page.tsx
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE; // ✅ server env (Vercel: API_BASE)

    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      // ✅ SEO + performance: ISR cache (revalidate উপরে আছে)
      next: { revalidate },
    });

    if (!res.ok) return null;

    const data = await res.json().catch(() => null);
    return data?.ok ? data.product : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);

  if (!p) {
    return {
      title: "Product not found",
      description: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const title = String(p.title || "Product");
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const img = p?.images?.[0] || "/logo.png";
  const url = `https://thecuriousempire.com/product/${p?._id || params.id}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },

    openGraph: {
      title,
      description: desc,
      url,
      siteName: "The Curious Empire",
      images: img ? [{ url: img }] : [],
      type: "product",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: img ? [img] : [],
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