// src/app/product/[id]/page.tsx
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE || "https://api.thecuriousempire.com";

  const res = await fetch(`${base}/api/products/${id}`, {
    // ✅ revalidate কাজ করার জন্য এইটা দরকার
    next: { revalidate: 60 },
  });

  // backend error handle
  if (!res.ok) return null;

  const data = await res.json();
  return data?.ok ? data.product : null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);

  if (!p) return { title: "Product not found" };

  const title = String(p.title || "Product");
  const desc = String(p.description || "").replace(/\s+/g, " ").slice(0, 160);
  const img = p.images?.[0] ? String(p.images[0]) : "";

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
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
    return <div className="container">Product not found</div>;
  }

  // ✅ server fetched product পাঠাচ্ছি
  return <ProductDetails id={params.id} product={product} />;
}