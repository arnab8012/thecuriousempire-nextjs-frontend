// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE;
    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.ok ? data.product : null;
  } catch {
    return null;
  }
}

// ✅ SEO safe (এখানে API call নাই)
export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  return {
    title: "Product | The Curious Empire",
    description: "Buy premium products online from The Curious Empire.",
  };
}

export default async function Page(
  { params }: { params: { id: string } }
) {
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