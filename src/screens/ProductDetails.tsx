"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "@/utils/useParams";
import { useNavigate } from "@/utils/useNavigate";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";

type ProductDetailsProps = {
  id?: string;
  initialProduct?: any;
};

export default function ProductDetails({ id: idProp, initialProduct }: ProductDetailsProps) {
  const { id: idFromUrl } = useParams();
  const id = idProp || idFromUrl;

  const nav = useNavigate();
  const { add, buyNow } = useCart();

  const [p, setP] = useState<any>(initialProduct ?? null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);

  const [idx, setIdx] = useState(0);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState<string>("");

  // ✅ initial product থাকলে variant init
  useEffect(() => {
    if (!initialProduct) return;
    const firstVar = initialProduct?.variants?.[0]?.name || "";
    setVariant(firstVar);
    setQty(1);
    setIdx(0);
  }, [initialProduct]);

  // ✅ Fetch product safely (client)
  useEffect(() => {
    let alive = true;
    if (!id) return () => (alive = false);

    (async () => {
      try {
        setErr("");
        const r = await api.get(`/api/products/${id}`);
        if (!alive) return;

        if (r?.ok) {
          setP(r.product);
          const firstVar = r.product?.variants?.[0]?.name || "";
          setVariant((v) => v || firstVar);
          setQty(1);
          setIdx(0);
        } else {
          // initialProduct থাকলে hard-fail দেখাবো না
          if (!initialProduct) {
            setP(null);
            setErr(r?.message || "Product not found");
          }
        }
      } catch {
        if (!alive) return;
        if (!initialProduct) {
          setP(null);
          setErr("Network/API error (product load failed)");
        }
      }
    })();

    return () => (alive = false);
  }, [id, initialProduct]);

  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    return arr.filter(Boolean);
  }, [p?.images]);

  // ✅ Auto slider
  useEffect(() => {
    if (imgs.length <= 1) return;
    const t = setInterval(() => setIdx((x) => (x + 1) % imgs.length), 2500);
    return () => clearInterval(t);
  }, [imgs.length]);

  // ✅ error show (no crash)
  if (err) {
    return (
      <div className="container" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
          Product load failed
        </div>
        <div className="muted" style={{ marginBottom: 12 }}>{err}</div>
        <button className="btnDarkFull" type="button" onClick={() => nav("/shop")}>
          Back to Shop
        </button>
      </div>
    );
  }

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

  const prev = () => {
    if (!imgs.length) return;
    setIdx((x) => (x - 1 + imgs.length) % imgs.length);
  };

  const next = () => {
    if (!imgs.length) return;
    setIdx((x) => (x + 1) % imgs.length);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    const w = window as any;
    if (w.__pd_toast_t) window.clearTimeout(w.__pd_toast_t);
    w.__pd_toast_t = window.setTimeout(() => setToast(""), 1200);
  };

  const selectedVar = (p?.variants || []).find((v: any) => v.name === variant);
  const availableStock = selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0;
  const canBuy = availableStock > 0 && qty <= availableStock;

  return (
    <div className="container">
      <div className="pd">
        {/* LEFT: Gallery */}
        <div>
          <div style={{ position: "relative" }}>
            <img
              className="pdImg"
              src={mainImg}
              alt={p.title}
              style={{ width: "100%", borderRadius: 14 }}
            />

            {imgs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                    fontSize: 20,
                  }}
                  aria-label="Previous image"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={next}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                    fontSize: 20,
                  }}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            {imgs.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 10,
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {imgs.map((_: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIdx(i)}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      background: i === idx ? "#111" : "rgba(0,0,0,0.25)",
                    }}
                    aria-label={`img-${i}`}
                  />
                ))}
              </div>
            )}
          </div>

          {imgs.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 12,
                overflowX: "auto",
                paddingBottom: 6,
              }}
            >
              {imgs.map((url: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  style={{
                    border: i === idx ? "2px solid #ff007a" : "1px solid #eee",
                    borderRadius: 12,
                    padding: 2,
                    background: "#fff",
                    cursor: "pointer",
                    flex: "0 0 auto",
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    width="78"
                    height="60"
                    style={{ objectFit: "cover", borderRadius: 10 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Details */}
        <div className="pdRight" style={{ position: "relative" }}>
          {toast ? (
            <div
              style={{
                position: "sticky",
                top: 8,
                zIndex: 20,
                background: "rgba(0,0,0,0.78)",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 12,
                width: "fit-content",
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              ✓ {toast}
            </div>
          ) : null}

          <h2>{p.title}</h2>

          <div className="priceRow">
            <span className="price">৳ {p.price}</span>
            {p.compareAtPrice ? <span className="cut">৳ {p.compareAtPrice}</span> : null}
          </div>

          <div className="muted">Delivery time: {p.deliveryDays}</div>

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

            <div className="qtyRow">
              <button
                className="qtyBtn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                type="button"
              >
                −
              </button>

              <input
                className="qtyInput"
                value={qty}
                onChange={(e) => {
                  const n = Math.max(1, Number((e.target as HTMLInputElement).value || 1));
                  if (availableStock > 0 && n > availableStock) {
                    setQty(availableStock);
                    showToast(`Only ${availableStock} in stock`);
                    return;
                  }
                  setQty(n);
                }}
                inputMode="numeric"
                type="number"
                min="1"
              />

              <button
                className="qtyBtn"
                onClick={() =>
                  setQty((q) => {
                    const nextQty = q + 1;
                    if (availableStock > 0 && nextQty > availableStock) {
                      showToast(`Only ${availableStock} in stock`);
                      return q;
                    }
                    return nextQty;
                  })
                }
                type="button"
              >
                +
              </button>
            </div>
          </div>

          <div className="pdBtns">
            <button
              className="btnPinkFull"
              onClick={() => {
                if (!canBuy) {
                  showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                  return;
                }
                add(cartItem);
                showToast("Added to cart");
              }}
              type="button"
              disabled={!canBuy}
            >
              Add to Cart
            </button>

            <button
              className="btnDarkFull"
              onClick={() => {
                if (!canBuy) {
                  showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                  return;
                }
                buyNow(p, variant, qty);
                nav("/checkout?mode=buy");
              }}
              type="button"
              disabled={!canBuy}
            >
              Buy Now
            </button>

            {availableStock <= 0 ? (
              <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>Stock Out</div>
            ) : null}
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