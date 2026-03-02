"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { api } from "../api/api";

type ProductDetailsProps = {
  id?: string;
  product?: any;
};

const FALLBACK_IMG = "https://via.placeholder.com/800x500?text=Product";

function toNum(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

export default function ProductDetails({ id, product }: ProductDetailsProps) {
  const router = useRouter();

  // ✅ CRASH PREVENTION
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // ✅ SAFE CART
  let cart: any = null;
  try {
    cart = useCart();
  } catch {
    cart = null;
  }

  const add = cart?.add ?? (() => {});
  const buyNow = cart?.buyNow ?? (() => {});

  const [p, setP] = useState<any>(product || null);
  const [loading, setLoading] = useState<boolean>(!product);
  const [err, setErr] = useState("");

  const [idx, setIdx] = useState(0);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setP(product);
      setVariant(product?.variants?.[0]?.name || "");
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (product || !id) return;

    let alive = true;

    (async () => {
      try {
        const r = await api.get(`/api/products/${id}`);
        if (!alive) return;

        if (r?.ok && r?.product) {
          setP(r.product);
          setVariant(r.product?.variants?.[0]?.name || "");
        } else {
          setErr("Product not found");
        }
      } catch {
        setErr("Product load failed");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, product]);

  const imgs = useMemo(() => {
    const arr = safeArray<string>(p?.images);
    return arr.length ? arr : [FALLBACK_IMG];
  }, [p?.images]);

  useEffect(() => {
    if (idx >= imgs.length) setIdx(0);
  }, [imgs.length, idx]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (err) return <div style={{ padding: 20 }}>{err}</div>;
  if (!p) return <div style={{ padding: 20 }}>No product</div>;

  const variants = safeArray<any>(p?.variants);
  const selectedVar = variants.find((v: any) => v?.name === variant);
  const availableStock = toNum(selectedVar?.stock ?? 0, 0);

  const canBuy = variants.length ? availableStock > 0 : true;

  return (
    <div style={{ padding: 20 }}>
      <img
        src={imgs[idx]}
        alt={p?.title}
        style={{ width: "100%", borderRadius: 12 }}
        onError={(e) =>
          ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)
        }
      />

      <h2>{p?.title}</h2>
      <p>৳ {p?.price}</p>

      {variants.length > 0 && (
        <select
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
        >
          {variants.map((v: any, i: number) => (
            <option key={i} value={v?.name}>
              {v?.name} ({v?.stock})
            </option>
          ))}
        </select>
      )}

      <div style={{ marginTop: 10 }}>
        <button
          disabled={!canBuy}
          onClick={() => add({ ...p, qty })}
        >
          Add to Cart
        </button>

        <button
          disabled={!canBuy}
          onClick={() => {
            buyNow(p, variant, qty);
            router.push("/checkout");
          }}
        >
          Buy Now
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>Description</h4>
        <p>{p?.description}</p>
      </div>
    </div>
  );
}