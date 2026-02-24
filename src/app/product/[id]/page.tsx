export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const site = "https://thecuriousempire.com";
  const url = `${site}/product/${params.id}`;

  return {
    title: "Product | The Curious Empire",
    description:
      "Premium Shopping Experience — Unique products delivered with quality & care.",
    alternates: { canonical: url },
    openGraph: {
      title: "Product | The Curious Empire",
      description:
        "Premium Shopping Experience — Unique products delivered with quality & care.",
      url,
      type: "website",
      images: [{ url: `${site}/logo.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Product | The Curious Empire",
      description:
        "Premium Shopping Experience — Unique products delivered with quality & care.",
      images: [`${site}/logo.png`],
    },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}