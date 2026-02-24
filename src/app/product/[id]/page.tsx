export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import ProductDetails from "@/screens/ProductDetails";

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}