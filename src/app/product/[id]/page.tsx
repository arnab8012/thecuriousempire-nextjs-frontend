import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/products/${params.id}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    const p = data?.product;

    if (!p) {
      return { title: "Product | The Curious Empire" };
    }

    return {
      title: `${p.title} | The Curious Empire`,
      description: p.description?.slice(0, 160),
      openGraph: {
        title: p.title,
        description: p.description?.slice(0, 160),
        images: [p.images?.[0]],
      },
    };
  } catch {
    return { title: "Product | The Curious Empire" };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}