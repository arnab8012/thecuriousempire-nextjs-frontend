"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";

export default function ProductDetails({ id }: { id: string }) {
  const router = useRouter();
  const { add, buyNow } = useCart();

  const [p, setP] = useState<any>(null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get(`/api/products/${id}`).then((r: any) => {
      if (r?.ok) {
        setP(r.product);
        setVariant(r.product?.variants?.[0]?.name || "");
      }
    });
  }, [id]);

  if (!p) return <div>Loading...</div>;

  return (
    <div>
      <h1>{p.title}</h1>
      <p>৳ {p.price}</p>

      <button
        onClick={() =>
          add({
            productId: p._id,
            title: p.title,
            price: p.price,
            qty: 1,
          })
        }
      >
        Add to Cart
      </button>

      <button
        onClick={() => {
          buyNow(p, variant, qty);
          router.push("/checkout?mode=buy");
        }}
      >
        Buy Now
      </button>
    </div>
  );
}