"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";

type ProductDetailsProps = {
  id?: string;
  initialProduct?: any;
};

const SITE = "https://thecuriousempire.com";

function cleanText(v: any) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function normalizeImage(x: any) {
  const v =
    typeof x === "string"
      ? x
      : x?.url || x?.secure_url || x?.src || x?.path || "";

  const s = String(v || "");
  if (!s) return `${SITE}/logo.png`;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${SITE}${s}`;
  return `${SITE}/${s}`;
}

export default function ProductDetails({ id: idProp, initialProduct }: ProductDetailsProps) {
  const router = useRouter();
  const params = useParams();

  const idFromUrl = (params?.id as string) || "";
  const id = idProp || idFromUrl;

  const { add, buyNow } = useCart();

  const [p, setP] = useState<any>(initialProduct ?? null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);

  const [idx, setIdx] = useState(0);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState<string>("");

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
          setP(null);
          setErr(r?.message || "Product not found");
        }
      } catch {
        if (!alive) return;
        setP(null);
        setErr("Network/API error (product load failed)");
      }
    })();

    return () => (alive = false);
  }, [id]);

  // ✅ normalize images (string/object both safe)
  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    const normalized = arr.map(normalizeImage).filter(Boolean);
    // fallback to single image field
    if (!normalized.length && p?.image) normalized.push(normalizeImage(p.image));
    return normalized;
  }, [p]);

  // ✅ Auto slider
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
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
          Product load failed
        </div>
        <div className="muted" style={{ marginBottom: 12 }}>{err}</div>
        <button className="btnDarkFull" type="button" onClick={() => router.push("/shop")}>
          Back to Shop
        </button>
      </div>
    );
  }

  if (!p) return <div className="container">Loading...</div>;

  const mainImg = imgs[idx] || `${SITE}/logo.png`;

  const selectedVar = (p?.variants || []).find((v: any) => String(v?.name) === String(variant));
  const availableStock = Number(selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0);
  const canBuy = availableStock > 0 && qty <= availableStock;

  const cartItem = {
    productId: p._id,
    title: cleanText(p.title),
    image: imgs[0] || mainImg,
    variant,
    qty,
    price: Number(p.price || 0),
  };

  const prev = () => imgs.length && setIdx((x) => (x - 1 + imgs.length) % imgs.length);
  const next = () => imgs.length && setIdx((x) => (x + 1) % imgs.length);

  return (
    <div className="container">
      <div className="pd">
        {/* LEFT: Gallery */}
        <div>
          <div style={{ position: "relative" }}>
            <img
              className="pdImg"
              src={mainImg}
              alt={cleanText(p.title)}
              style={{ width: "100%", borderRadius: 14 }}
            />

            {imgs.length > 1 && (
              <>
                <button type="button" onClick={prev} aria-label="Previous image"
                  style={{
                    position: "absolute", left: 10, top: "50%",
                    transform: "translateY(-50%)",
                    width: 40, height: 40, borderRadius: 999,
                    border: "none", cursor: "pointer",
                    background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 20,
                  }}>
                  ‹
                </button>

                <button type="button" onClick={next} aria-label="Next image"
                  style={{
                    position: "absolute", right: 10, top: "50%",
                    transform: "translateY(-50%)",
                    width: 40, height: 40, borderRadius: 999,
                    border: "none", cursor: "pointer",
                    background: "rgba(0,0,0,0.45)", color: "#fff", fontSize: 20,
                  }}>
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
                  <img src={url} alt="" width="78" height="60" style={{ objectFit: "cover", borderRadius: 10 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Details */}
        <div className="pdRight" style={{ position: "relative" }}>
          {toast ? (
            <div style={{
              position: "sticky", top: 8, zIndex: 20,
              background: "rgba(0,0,0,0.78)", color: "#fff",
              padding: "10px 14px", borderRadius: 12,
              width: "fit-content", fontWeight: 800, marginBottom: 10,
            }}>
              ✓ {toast}
            </div>
          ) : null}

          <h2>{cleanText(p.title)}</h2>

          <div className="priceRow">
            <span className="price">৳ {Number(p.price || 0)}</span>
            {p.compareAtPrice ? <span className="cut">৳ {Number(p.compareAtPrice || 0)}</span> : null}
          </div>

          <div className="muted">Delivery time: {cleanText(p.deliveryDays || "")}</div>

          {Array.isArray(p.variants) && p.variants.length ? (
            <div className="box">
              <div className="lbl">Available variant:</div>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="input"
              >
                {p.variants.map((v: any, i: number) => (
                  <option key={i} value={String(v?.name || "")}>
                    {cleanText(v?.name)} (Stock: {Number(v?.stock || 0)})
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
                router.push("/checkout?mode=buy");
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
            <p className="product-description muted">{cleanText(p.description) || "No description yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}