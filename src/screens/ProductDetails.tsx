"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";

type ProductDetailsProps = {
  id: string;
};

const SITE = "https://thecuriousempire.com";
const PROD_FALLBACK = "https://api.thecuriousempire.com";

function pickApiBaseClient() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:5000");

  return String(raw || "").replace(/\/+$/, "");
}

// ✅ IMPORTANT: images often live on API domain (not SITE domain)
function absImg(url: any) {
  const base = pickApiBaseClient();
  const u = String(url || "").trim();
  if (!u) return `${SITE}/logo.png`;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${base}${u}`;
  return `${base}/${u}`;
}

export default function ProductDetails({ id }: ProductDetailsProps) {
  const router = useRouter();
  const { add, buyNow } = useCart();

  const [p, setP] = useState<any>(null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [idx, setIdx] = useState(0);

  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    if (!id) return () => (alive = false);

    (async () => {
      try {
        setErr("");
        const r = await api.get(`/api/products/${id}`);

        if (!alive) return;

        if (r?.ok && r?.product) {
          setP(r.product);
          const firstVar = r.product?.variants?.[0]?.name || "";
          setVariant(firstVar);
          setQty(1);
          setIdx(0);
        } else {
          setP(null);
          setErr(r?.message || "Product not found");
        }
      } catch (e: any) {
        if (!alive) return;
        setP(null);
        setErr(e?.message || "Network/API error");
      }
    })();

    return () => (alive = false);
  }, [id]);

  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    const cleaned = arr.filter(Boolean).map(absImg);
    if (!cleaned.length && p?.image) return [absImg(p.image)];
    return cleaned;
  }, [p?.images, p?.image]);

  // auto slider
  useEffect(() => {
    if (imgs.length <= 1) return;
    const t = setInterval(() => setIdx((x) => (x + 1) % imgs.length), 2500);
    return () => clearInterval(t);
  }, [imgs.length]);

  const showToast = (msg: string) => {
    setToast(msg);
    const w = window as any;
    if (w.__pd_toast_t) window.clearTimeout(w.__pd_toast_t);
    w.__pd_toast_t = window.setTimeout(() => setToast(""), 1200);
  };

  if (err) {
    return (
      <div className="container" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Product load failed</div>
        <div className="muted" style={{ marginBottom: 12 }}>{err}</div>

        <button className="btnDarkFull" type="button" onClick={() => router.push("/shop")}>
          Back to Shop
        </button>
      </div>
    );
  }

  if (!p) return <div className="container">Loading...</div>;

  const mainImg = imgs[idx] || `${SITE}/logo.png`;

  const selectedVar = (p?.variants || []).find((v: any) => v.name === variant);
  const availableStock = selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0;
  const canBuy = availableStock > 0 && qty <= availableStock;

  const cartItem = {
    productId: p._id,
    title: p.title,
    image: imgs[0] || mainImg,
    variant,
    qty,
    price: p.price,
  };

  const prev = () => imgs.length && setIdx((x) => (x - 1 + imgs.length) % imgs.length);
  const next = () => imgs.length && setIdx((x) => (x + 1) % imgs.length);

  return (
    <div className="container">
      <div className="pd">
        {/* LEFT */}
        <div>
          <div style={{ position: "relative" }}>
            <img
              className="pdImg"
              src={mainImg}
              alt={p.title}
              style={{ width: "100%", borderRadius: 14 }}
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = `${SITE}/logo.png`)}
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
          </div>

          {imgs.length > 1 && (
            <div style={{ display: "flex", gap: 10, marginTop: 12, overflowX: "auto", paddingBottom: 6 }}>
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
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = `${SITE}/logo.png`)}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
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
              <button className="qtyBtn" onClick={() => setQty((q) => Math.max(1, q - 1))} type="button">
                −
              </button>

              <input
                className="qtyInput"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number((e.target as HTMLInputElement).value || 1)))}
                inputMode="numeric"
                type="number"
                min="1"
              />

              <button className="qtyBtn" onClick={() => setQty((q) => q + 1)} type="button">
                +
              </button>
            </div>
          </div>

          <div className="pdBtns">
            <button
              className="btnPinkFull"
              onClick={() => {
                if (!canBuy) return showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
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
                if (!canBuy) return showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                buyNow(p, variant, qty);
                router.push("/checkout?mode=buy");
              }}
              type="button"
              disabled={!canBuy}
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