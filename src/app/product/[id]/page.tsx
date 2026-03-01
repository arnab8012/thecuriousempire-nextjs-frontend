import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE;

    if (!base) {
      console.error("API_BASE missing");
      return null;
    }

    const res = await fetch(`${base}/api/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Fetch failed:", res.status);
      return null;
    }

    const data = await res.json();

    return data?.ok ? data.product : null;
  } catch (err) {
    console.error("Server fetch error:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);

  if (!p) {
    return {
      title: "Product not found",
      description: "Product not found",
    };
  }

  const title = p.title;
  const desc = String(p.description || "").slice(0, 160);
  const img = p.images?.[0];

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: img ? [{ url: img }] : [],
      type: "product",
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