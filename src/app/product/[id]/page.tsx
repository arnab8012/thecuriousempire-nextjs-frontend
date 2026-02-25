// src/app/product/[id]/page.tsx
import ProductDetails from "@/screens/ProductDetails";

export default function Page({ params }: { params: { id: string } }) {
  return <ProductDetails id={params.id} />;
}