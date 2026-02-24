"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/api/api";
import { useCart } from "@/context/CartContext";

type Variant = {
  name: string;
  stock?: number;
};

type Product = {
  _id: string;
  title?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  deliveryDays?: string;
  images?: string[];
  image?: string;
  variants?: Variant[];
};

export default function ProductDetails({ id: idProp }: { id?: string }) {
  const params = useParams<{ id?: string }>();
  const router = useRouter();

  const idFromUrl = typeof params?.id === "string" ? params.id : "";
  const id = idProp || idFromUrl;

  const { add, buyNow } = useCart();

  const [p, setP] = useState<Product | null>(null);
  const [variant, setVariant] = useState<string>("");
  const [qty, setQty] = useState<number>(1);

  const [idx, setIdx] = useState<number>(0);
  const [toast, setToast] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // load product
  useEffect(() => {
    let alive = true;
    if (!id) return () => void (alive = false);

    (async () => {
      try {
        setErr("");
        setP(null);

        const r: any = await api.get(`/api/products/${id}`);
        if (!alive) return;

        // backend might return {ok, product} or direct product
        const product: Product | null = r?.ok ? r?.product : (r?.product ?? r ?? null);

        if (r?.ok === false) {
          setErr(r?.message || "Product not found");
          setP(null);
          return;
        }

        if (!product || !product._id) {
          setErr("Product not found");
          setP(null);
          return;
        }

        setP(product);

        const firstVar = product?.variants?.[0]?.name || "";
        setVariant(firstVar);
        setQty(1);
        setIdx(0);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ? `Network/API error: ${e.message}` : "Network/API error (product load failed)");
        setP(null);
      }
    })();

    return () => void (alive = false);
  }, [id]);

  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p!.images! : [];
    return arr.filter(Boolean);
  }, [p?.images]);

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

  const selectedVar = (p?.variants || []).find((v) => v.name === variant);
  const availableStock = (selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0) as number;
  const canBuy = availableStock > 0 && qty <= availableStock;

  const mainImg =
    imgs[idx] ||
    p?.image ||
    "https://via.placeholder.com/800x500?text=Product";

  const prev = () => {
    if (!imgs.length) return;
    setIdx((x) => (x - 1 + imgs.length) % imgs.length);
  };

  const next = () => {
    if (!imgs.length) return;
    setIdx((x) => (x + 1) % imgs.length);
  };

  // UI states
  if (err) {
    return (
      <div className="container" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
          Product load failed
        </div>
        <div className="muted" style={{ marginBottom: 12 }}>
          {err}
        </div>
        <button className="btnDarkFull" type="button" onClick={() => router.push("/shop")}>
          Back to Shop
        </button>
      </div>
    );
  }

  if (!p) return <div className="container">Loading...</div>;

  const cartItem = {
    productId: p._id,
    title: p.title || "Product",
    image: imgs[0] || mainImg,
    variant,
    qty,
    price: p.price || 0,
  };

  return (
    <div className="container">
      <div className="pd">
        {/* LEFT: Gallery */}
        <div>
          <div style={{ position: "relative" }}>
            <img
              className="pdImg"
              src={mainImg}
              alt={p.title || "Product"}
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
                {imgs.map((_, i) => (
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
              {imgs.map((url, i) => (
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
                    width={78}
                    height={60}
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
            <span className="price">৳ {p.price ?? 0}</span>
            {p.compareAtPrice ? <span className="cut">৳ {p.compareAtPrice}</span> : null}
          </div>

          <div className="muted">Delivery time: {p.deliveryDays || "3-5 days"}</div>

          {p.variants?.length ? (
            <div className="box">
              <div className="lbl">Available variant:</div>
              <select
                value={variant}
                onChange={(e) => {
                  const v = e.target.value;
                  setVariant(v);
                  setQty(1);
                }}
                className="input"
              >
                {p.variants.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} (Stock: {v.stock ?? 0})
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
                  const n = Math.max(1, Number(e.target.value || 1));
                  if (availableStock > 0 && n > availableStock) {
                    setQty(availableStock);
                    showToast(`Only ${availableStock} in stock`);
                    return;
                  }
                  setQty(n);
                }}
                inputMode="numeric"
                type="number"
                min={1}
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
            <p className="product-description muted">{p.description || "No description yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}