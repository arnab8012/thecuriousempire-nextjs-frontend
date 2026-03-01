// src/app/product/[id]/page.tsx

import ProductDetails from "@/screens/ProductDetails";
import type { Metadata } from "next";

async function getProduct(id: string) {
  try {
    const base = process.env.API_BASE;
    if (!base) return null;

    const res = await fetch(`${base}/api/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data?.ok ? data.product : null;
  } catch {
    return null;
  }
}

// 🔥 IMPORTANT: metadata এ আর API call করবো না
export async function generateMetadata(
  { params }: { params: { id: