import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE || "https://api.thecuriousempire.com";

    const res = await fetch(`${base}/api/products/${id}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("API status:", res.status);
      return null;
    }

    if (!text) return null;

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON from API");
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

  const url = `https://thecuriousempire.com/product/${params.id}`;

  if (!p) {
    return {
      title: "Product not found",
      description: "This product is not available.",
      alternates: { canonical: url },
    };
  }

  const title = String(p.title || "Product");
  const desc = String(p.description || "")
    .replace(/\s+/g, " ")
    .slice(0, 160);

  const image =
    Array.isArray(p.images) && p.images[0]
      ? p.images[0]
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
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [image],
    },
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