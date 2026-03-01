// src/app/product/[id]/page.tsx

import type { Metadata } from "next";
import ProductDetails from "@/screens/ProductDetails";

export const revalidate = 60;

type Product = {
  _id: string;
  title?: string;
  description?: string;
  images?: string[];
  price?: number;
  compareAtPrice?: number;
  category?: { name?: string };
  isActive?: boolean;
};

async function getProduct(id: string): Promise<Product | null> {
  try {
    const base = process.env.API_BASE;
    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      next: { revalidate },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.ok ? (data.product as Product) : null;
  } catch {
    return null;
  }
}

function cleanText(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function stripBrandSuffix(title: string) {
  return cleanText(title).replace(/\s*\|\s*The Curious Empire\s*$/i, "");
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const p = await getProduct(params.id);
  const url = `https://thecuriousempire.com/product/${params.id}`;

  if (!p) {
    return {
      title: "Product not found", // ✅ template auto add করবে
      description: "This product is not available.",
      alternates: { canonical: url },
    };
  }

  // ✅ এখানে ব্র্যান্ড suffix দিচ্ছি না (RootLayout template দিয়ে দিবে)
  const title = stripBrandSuffix(p.title || "Product");
  const desc = cleanText(p.description || "").slice(0, 160);
  const image =
    Array.isArray(p.images) && p.images[0] ? p.images[0] : "/logo.png";

  return {
    title, // ✅ Only "Product Title"
    description: desc,
    alternates: { canonical: url },

    openGraph: {
      title,
      description: desc,
      url,
      siteName: "The Curious Empire",
      images: [{ url: image }],
      type: "product", // ✅ better than "website" for product pages
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

  const url = `https://thecuriousempire.com/product/${params.id}`;
  const mainImage =
    Array.isArray(product.images) && product.images[0] ? product.images[0] : undefined;

  // ✅ SEO: Product JSON-LD (Rich Results)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: cleanText(product.title || "Product"),
    image: Array.isArray(product.images) ? product.images : mainImage ? [mainImage] : [],
    description: cleanText(product.description || ""),
    brand: { "@type": "Brand", name: "The Curious Empire" },
    category: cleanText(product.category?.name || ""),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "BDT",
      price: product.price != null ? String(product.price) : "",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails id={params.id} product={product} />
    </>
  );
}