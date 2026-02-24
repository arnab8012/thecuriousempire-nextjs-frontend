"use client";

import { useParams } from "next/navigation";
import ProductDetails from "@/screens/ProductDetails";

export default function Page() {
  const params = useParams();
  const id = (params?.id as string) || "";

  return <ProductDetails id={id} />;
}