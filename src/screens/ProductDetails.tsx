"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";

type ProductDetailsProps = { id: string };

const PROD_FALLBACK = "https://api.thecuriousempire.com";
const SITE_FALLBACK = "https://thecuriousempire.com";

function pickApiBaseClient() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:5000");
  return String(raw || "").replace(/\/+$/, "");
}

function s(v: any, fb = "") {
  if (v == null) return fb;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // object/array → safe stringify-ish
  try {
    if (typeof v?.toString === "function" && v.toString !== Object.prototype.toString) return String(v);
  } catch {}
  return fb;
}

function num(v: any, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

// ✅ supports images as string OR {url} OR {src}
function normalizeImage(x: any): string {
  const base = pickApiBaseClient();
  const raw =
    typeof x === "string"
      ? x
      : typeof x === "object" && x
      ? (x.url || x.src || x.path || "")
      : "";

  const u = String(raw || "").trim();
  if (!u) return `${SITE_FALLBACK}/logo.png`;
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
          const firstVar = s(r.product?.variants?.[0]?.name, "");
          setVariant(firstVar);
          setQty(1);
          setIdx(0);
        } else {
          setP(null);
          setErr(s(r?.message, "Product not found"));
        }
      } catch (e: any) {
        if (!alive) return;
        setP(null);
        setErr(s(e?.message, "Network/API error"));
      }
    })();

    return () => (alive = false);
  }, [id]);

  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    const list = arr.map(normalizeImage).filter(Boolean);
    if (list.length) return list;

    const single = p?.image ? normalizeImage(p.image) : "";
    return single ? [single] : [`${SITE_FALLBACK}/logo.png`];
  }, [p?.images, p?.image]);

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

  const title = s(p?.title, "Product");
  const price = num(p?.price, 0);
  const compareAt = p?.compareAtPrice ? num(p.compareAtPrice, 0) : 0;

  const mainImg = imgs[idx] || `${SITE_FALLBACK}/logo.png`;

  const variants = Array.isArray(p?.variants) ? p.variants : [];
  const safeVariantNames = variants.map((v: any) => s(v?.name, "")).filter(Boolean);

  // variant pick fallback
  useEffect(() => {
    if (!variant && safeVariantNames.length) setVariant(safeVariantNames[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeVariantNames.length]);

  const selectedVar = variants.find((v: any) => s(v?.name, "") === variant);
  const availableStock = num(selectedVar?.stock ?? variants?.[0]?.stock, 0);
  const canBuy = availableStock > 0 && qty <= availableStock;

  const cartItem = {
    productId: s(p?._id, ""),
    title,
    image: imgs[0] || mainImg,
    variant,
    qty,
    price,
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
              alt={title}
              style={{ width: "100%", borderRadius: 14 }}
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = `${SITE_FALLBACK}/logo.png`)}
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
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = `${SITE_FALLBACK}/logo.png`)}
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

          <h2>{title}</h2>

          <div className="priceRow">
            <span className="price">৳ {price}</span>
            {compareAt ? <span className="cut">৳ {compareAt}</span> : null}
          </div>

          <div className="muted">Delivery time: {s(p?.deliveryDays, "")}</div>

          {safeVariantNames.length ? (
            <div className="box">
              <div className="lbl">Available variant:</div>
              <select value={variant} onChange={(e) => setVariant(e.target.value)} className="input">
                {safeVariantNames.map((name: string, i: number) => {
                  const v = variants.find((x: any) => s(x?.name, "") === name);
                  return (
                    <option key={i} value={name}>
                      {name} (Stock: {num(v?.stock, 0)})
                    </option>
                  );
                })}
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
                onChange={(e) => setQty(Math.max(1, num((e.target as HTMLInputElement).value, 1)))}
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

            {availableStock <= 0 ? (
              <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>Stock Out</div>
            ) : null}
          </div>

          <div className="box">
            <h4>Description</h4>
            <p className="product-description muted">{s(p?.description, "No description yet.")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}