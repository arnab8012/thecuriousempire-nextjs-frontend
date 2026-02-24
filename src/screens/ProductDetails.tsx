"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../api/api"; // তোমার path ঠিক থাকলে রাখো
import { useCart } from "../context/CartContext";

export default function ProductDetails({ id: idProp }: { id?: string }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = idProp || params?.id;

  const { add, buyNow } = useCart();

  const [p, setP] = useState<any>(null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [idx, setIdx] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    if (!id) return;

    (async () => {
      try {
        // ✅ IMPORTANT: base env ঠিক না থাকলে api wrapper ভেঙে যায়
        const base =
          process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL;

        if (!base) {
          setErr("Missing NEXT_PUBLIC_API_BASE / NEXT_PUBLIC_API_URL");
          return;
        }

        // ✅ api wrapper না চাইলে fetch use করতে পারো
        const r = await api.get(`/api/products/${id}`);

        if (!alive) return;

        if (r?.ok) {
          setP(r.product);
          const firstVar = r.product?.variants?.[0]?.name || "";
          setVariant(firstVar);
          setQty(1);
          setIdx(0);
          setErr("");
        } else {
          setErr(r?.message || "Product not found");
        }
      } catch (e: any) {
        setErr(e?.message || "Fetch failed");
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    return arr.filter(Boolean);
  }, [p?.images]);

  if (err) return <div className="container" style={{ padding: 20 }}>{err}</div>;
  if (!p) return <div className="container">Loading...</div>;

  const mainImg = imgs[idx] || "https://via.placeholder.com/800x500?text=Product";

  const cartItem = {
    productId: p._id,
    title: p.title,
    image: imgs[0] || mainImg,
    variant,
    qty,
    price: p.price,
  };

  const selectedVar = (p?.variants || []).find((v: any) => v.name === variant);
  const availableStock = selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0;
  const canBuy = availableStock > 0 && qty <= availableStock;

  return (
    <div className="container">
      <div className="pd">
        <div>
          <img className="pdImg" src={mainImg} alt={p.title} style={{ width: "100%", borderRadius: 14 }} />

          {imgs.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto" }}>
              {imgs.map((url: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  style={{
                    border: i === idx ? "2px solid #111" : "1px solid #eee",
                    borderRadius: 12,
                    padding: 2,
                    background: "#fff",
                    cursor: "pointer",
                    flex: "0 0 auto",
                  }}
                >
                  <img src={url} alt="" width="78" height="60" style={{ objectFit: "cover", borderRadius: 10 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdRight">
          <h2>{p.title}</h2>
          <div className="priceRow">
            <span className="price">৳ {p.price}</span>
            {p.compareAtPrice ? <span className="cut">৳ {p.compareAtPrice}</span> : null}
          </div>

          {p.variants?.length ? (
            <div className="box">
              <div className="lbl">Available variant:</div>
              <select value={variant} onChange={(e) => setVariant(e.target.value)} className="input">
                {p.variants.map((v: any, i: number) => (
                  <option key={i} value={v.name}>
                    {v.name} (Stock: {v.stock})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="box">
            <div className="lbl">Quantity</div>
            <input
              className="qtyInput"
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              inputMode="numeric"
              type="number"
              min="1"
            />
            {availableStock <= 0 ? (
              <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>Stock Out</div>
            ) : null}
          </div>

          <div className="pdBtns">
            <button
              className="btnPinkFull"
              type="button"
              disabled={!canBuy}
              onClick={() => add(cartItem)}
            >
              Add to Cart
            </button>

            <button
              className="btnDarkFull"
              type="button"
              disabled={!canBuy}
              onClick={() => {
                buyNow(p, variant, qty);
                router.push("/checkout?mode=buy");
              }}
            >
              Buy Now
            </button>
          </div>

          <div className="box">
            <h4>Description</h4>
            <p className="product-description muted">{p.description || "No description yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}