"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { api } from "../api/api";

type ProductDetailsProps = {
  id?: string;
};

const FALLBACK_IMG = "https://via.placeholder.com/800x500?text=Product";

function toNum(v: any, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function safeText(v: any) {
  return String(v ?? "").trim();
}

function safeArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

export default function ProductDetails({ id }: ProductDetailsProps) {
  const router = useRouter();

  // ✅ useCart না থাকলেও crash না করার জন্য safe fallback
  const cart = (typeof useCart === "function" ? (useCart() as any) : null) as any;
  const add = cart?.add || (() => {});
  const buyNow = cart?.buyNow || (() => {});

  const [p, setP] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [idx, setIdx] = useState(0);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");

  // ✅ product fetch
  useEffect(() => {
    let alive = true;

    if (!id) {
      setErr("Missing product id");
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        setLoading(true);
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
          setErr(r?.message || "Product not found");
          setP(null);
        }
      } catch {
        if (!alive) return;
        setErr("Network/API error (product load failed)");
        setP(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  const imgs = useMemo(() => {
    const arr = safeArray<string>(p?.images).filter(Boolean);
    const alt = [p?.image].filter(Boolean).map(String);
    const list = arr.length ? arr : alt;
    return list.length ? list : [FALLBACK_IMG];
  }, [p?.images, p?.image]);

  // ✅ auto slide
  useEffect(() => {
    if (imgs.length <= 1) return;
    const t = setInterval(() => setIdx((x) => (x + 1) % imgs.length), 3000);
    return () => clearInterval(t);
  }, [imgs.length]);

  const mainImg = imgs[idx] || FALLBACK_IMG;

  const variants = safeArray<any>(p?.variants);
  const selectedVar = variants.find((v: any) => String(v?.name) === String(variant));
  const availableStock = toNum(selectedVar?.stock ?? variants?.[0]?.stock ?? 0, 0);
  const canBuy = availableStock > 0 ? qty <= availableStock : true; // stock field না থাকলেও কিনতে দেবে

  const showToast = (msg: string) => {
    setToast(msg);

    // ✅ window guard (crash avoid)
    if (typeof window === "undefined") return;

    try {
      window.clearTimeout((window as any).__pd_toast_t);
      (window as any).__pd_toast_t = window.setTimeout(() => setToast(""), 1200);
    } catch {}
  };

  if (loading) return <div className="container" style={{ padding: 16 }}>Loading...</div>;

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

  if (!p) return <div className="container" style={{ padding: 16 }}>No product.</div>;

  // ✅ productId fallback (_id/id)
  const productId = String(p?._id ?? p?.id ?? id ?? "");

  const cartItem = {
    productId,
    title: p?.title,
    image: imgs[0] || mainImg,
    variant: variant || "",
    qty,
    price: p?.price,
  };

  return (
    <div className="container">
      <div className="pd">
        {/* LEFT */}
        <div>
          <div style={{ position: "relative" }}>
            <img
              className="pdImg"
              src={mainImg}
              alt={safeText(p?.title) || "Product"}
              style={{ width: "100%", borderRadius: 14 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
              }}
            />

            {imgs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setIdx((x) => (x - 1 + imgs.length) % imgs.length)}
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
                  onClick={() => setIdx((x) => (x + 1) % imgs.length)}
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
                  key={url + i}
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
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://via.placeholder.com/78x60?text=Img";
                    }}
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

          <h2>{p?.title}</h2>

          <div className="priceRow">
            <span className="price">৳ {p?.price}</span>
            {p?.compareAtPrice ? <span className="cut">৳ {p?.compareAtPrice}</span> : null}
          </div>

          <div className="muted">Delivery time: {p?.deliveryDays}</div>

          {variants.length ? (
            <div className="box">
              <div className="lbl">Available variant:</div>
              <select value={variant} onChange={(e) => setVariant(e.target.value)} className="input">
                {variants.map((v: any, i: number) => (
                  <option key={String(v?.name || i)} value={v?.name}>
                    {v?.name} (Stock: {toNum(v?.stock, 0)})
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
                if (availableStock > 0 && !canBuy) {
                  showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                  return;
                }
                add(cartItem);
                showToast("Added to cart");
              }}
              type="button"
              disabled={availableStock > 0 ? !canBuy : false}
            >
              Add to Cart
            </button>

            <button
              className="btnDarkFull"
              onClick={() => {
                if (availableStock > 0 && !canBuy) {
                  showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                  return;
                }
                buyNow(p, variant || "", qty);
                router.push("/checkout?mode=buy");
              }}
              type="button"
              disabled={availableStock > 0 ? !canBuy : false}
            >
              Buy Now
            </button>

            {availableStock <= 0 && variants.length ? (
              <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>Stock Out</div>
            ) : null}
          </div>

          <div className="box">
            <h4>Description</h4>
            <p className="product-description muted">{p?.description || "No description yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}