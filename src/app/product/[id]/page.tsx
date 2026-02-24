import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

const SITE = "https://thecuriousempire.com";
const API = "https://api.thecuriousempire.com";

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const res = await fetch(`${API}/api/products/${params.id}`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("not found");

    const data = await res.json();
    const p = data.product;

    return {
      title: `${p.title} | The Curious Empire`,
      description: p.description?.slice(0, 160),
      alternates: {
        canonical: `${SITE}/product/${params.id}`,
      },
      openGraph: {
        title: p.title,
        description: p.description,
        url: `${SITE}/product/${params.id}`,
        images: [
          {
            url: p.images?.[0] || `${SITE}/logo.png`,
          },
        ],
        type: "product",
      },
    };
  } catch {
    return {
      title: "Product | The Curious Empire",
    };
  }
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}