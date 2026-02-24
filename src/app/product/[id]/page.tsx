// src/app/product/[id]/page.tsx
import ProductDetails from "@/screens/ProductDetails";
import { api } from "@/screens/api/api";
import type { Metadata } from "next";

const SITE = "https://thecuriousempire.com";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
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
      alternates: {
        canonical: `${SITE}/product/${p._id}`,
      },
      openGraph: {
        title: p.title,
        description: p.description?.slice(0, 160),
        url: `${SITE}/product/${p._id}`,
        images: [
          {
            url: p.images?.[0] || `${SITE}/logo.png`,
          },
        ],
      },
    };
  } catch {
    return { title: "Product | The Curious Empire" };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}