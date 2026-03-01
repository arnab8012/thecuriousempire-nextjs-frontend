// src/app/product/[id]/page.tsx
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  const base = process.env.API_BASE;

  if (!base) {
    console.error("API_BASE missing");
    return null;
  }

  try {
    const res = await fetch(`${base}/api/products/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error("API response not OK:", res.status);
      return null;
    }

    const data = await res.json();

    if (!data?.ok) return null;

    return data.product;
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      title: "Product not found",
      description: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const title = product.title;
  const description = String(product.description || "")
    .replace(/\n/g, " ")
    .slice(0, 160);

  const image = product.images?.[0] || "/logo.png";
  const url = `https://thecuriousempire.com/product/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },

    openGraph: {
      title,
      description,
      url,
      images: [{ url: image }],
      type: "product",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
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