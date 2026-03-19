"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { api } from "@/api/api";

type ProductDetailsProps = {
  id?: string;
  product?: any;
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

function renderStars(n: number) {
  const rating = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function ProductDetails({ id, product }: ProductDetailsProps) {
  const router = useRouter();

  // ✅ always safe (CartContext now has defaults)
  const cart = useCart();
  const add = cart.add;
  const buyNow = cart.buyNow;

  const [p, setP] = useState<any>(product || null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState<boolean>(!product);

  const [idx, setIdx] = useState(0);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState("");

  const [reviews, setReviews] = useState<any[]>([]);
const [reviewSummary, setReviewSummary] = useState<any>({
  averageRating: 0,
  reviewCount: 0,
  breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
});
const [reviewLoading, setReviewLoading] = useState(false);
const [reviewErr, setReviewErr] = useState("");
const [myRating, setMyRating] = useState(5);
const [myComment, setMyComment] = useState("");
const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    if (typeof window === "undefined") return;
    try {
      window.clearTimeout((window as any).__pd_toast_t);
      (window as any).__pd_toast_t = window.setTimeout(() => setToast(""), 1200);
    } catch {}
  };

  // ✅ when product prop changes (route change), sync it
  useEffect(() => {
    if (product) {
      setP(product);

      const firstVar = product?.variants?.[0]?.name || "";
      setVariant(firstVar);
      setQty(1);
      setIdx(0);

      setErr("");
      setLoading(false);
    }
  }, [product]);

  // ✅ fallback fetch ONLY when product not provided (safe)
  useEffect(() => {
    let alive = true;

    if (product) return;

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
  }, [id, product]);

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

  const hasStock = variants.length > 0;
  const canBuy = !hasStock ? true : availableStock > 0 && qty <= availableStock;

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

  const productId = String(p?._id ?? p?.id ?? id ?? "");

const loadReviews = async (pid: string) => {
  if (!pid) return;

  try {
    setReviewLoading(true);
    setReviewErr("");

    const r = await api.get(`/api/reviews/product/${pid}`);

    if (r?.ok) {
      setReviews(Array.isArray(r.reviews) ? r.reviews : []);
      setReviewSummary(
        r.summary || {
          averageRating: 0,
          reviewCount: 0,
          breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        }
      );
    } else {
      setReviewErr(r?.message || "Failed to load reviews");
    }
  } catch {
    setReviewErr("Failed to load reviews");
  } finally {
    setReviewLoading(false);
  }
};
useEffect(() => {
  if (productId) loadReviews(productId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [productId]);

  const cartItem = {
    productId,
    title: p?.title,
    image: imgs[0] || mainImg,
    variant: variant || "",
    qty,
    price: p?.price,
  };

  const requireTokenOrGoLogin = (nextUrl: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
      return false;
    }
    return true;
  };
const submitReview = async () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  if (!token) {
    router.push(`/login?next=${encodeURIComponent(`/product/${productId}`)}`);
    return;
  }

  if (!productId) {
    showToast("Product missing");
    return;
  }

  const rating = Number(myRating);
  if (rating < 1 || rating > 5) {
    showToast("Select valid rating");
    return;
  }

  try {
    setReviewSubmitting(true);

    const res = await api.postAuth("/api/reviews", token, {
      productId,
      rating,
      comment: myComment,
    });

    if (res?.ok) {
      showToast("Review submitted");
      setMyRating(5);
      setMyComment("");
      await loadReviews(productId);
    } else {
      showToast(res?.message || "Review submit failed");
    }
  } catch {
    showToast("Review submit failed");
  } finally {
    setReviewSubmitting(false);
  }
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
                  if (hasStock && availableStock > 0 && n > availableStock) {
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
                    if (hasStock && availableStock > 0 && nextQty > availableStock) {
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
                if (hasStock && !canBuy) {
                  showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                  return;
                }
                add(cartItem);
                showToast("Added to cart");
              }}
              type="button"
              disabled={hasStock ? !canBuy : false}
            >
              Add to Cart
            </button>

            <button
              className="btnDarkFull"
              onClick={() => {
                if (!requireTokenOrGoLogin("/checkout?mode=buy")) return;

                if (hasStock && !canBuy) {
                  showToast(availableStock <= 0 ? "Stock Out" : `Only ${availableStock} in stock`);
                  return;
                }

                buyNow(p, variant || "", qty);
                router.push("/checkout?mode=buy");
              }}
              type="button"
              disabled={hasStock ? !canBuy : false}
            >
              Buy Now
            </button>

            {hasStock && availableStock <= 0 ? (
              <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>Stock Out</div>
            ) : null}
          </div>

          <div className="box">
            <h4>Description</h4>
            <p className="product-description muted">{p?.description || "No description yet."}</p>
          </div>
<div className="box">
  <h4 style={{ marginBottom: 10 }}>Write a Review</h4>

  <div style={{ display: "grid", gap: 10 }}>
    <select
      className="input"
      value={myRating}
      onChange={(e) => setMyRating(Number(e.target.value))}
    >
      <option value={5}>5 Star</option>
      <option value={4}>4 Star</option>
      <option value={3}>3 Star</option>
      <option value={2}>2 Star</option>
      <option value={1}>1 Star</option>
    </select>

    <textarea
      className="input"
      rows={4}
      placeholder="Write your review"
      value={myComment}
      onChange={(e) => setMyComment(e.target.value)}
      style={{ resize: "vertical", paddingTop: 12 }}
    />

    <button
      className="btnDarkFull"
      type="button"
      onClick={submitReview}
      disabled={reviewSubmitting}
    >
      {reviewSubmitting ? "Submitting..." : "Submit Review"}
    </button>
  </div>
</div>

<div className="box">
  <h4 style={{ marginBottom: 10 }}>Customer Reviews</h4>

  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 22, fontWeight: 900 }}>
      {Number(reviewSummary?.averageRating || 0).toFixed(1)} / 5
    </div>
    <div style={{ color: "#f59e0b", fontSize: 18, fontWeight: 900 }}>
      {renderStars(Number(reviewSummary?.averageRating || 0))}
    </div>
    <div className="muted">{Number(reviewSummary?.reviewCount || 0)} total reviews</div>
  </div>

  {reviewLoading ? <div className="muted">Loading reviews...</div> : null}
  {reviewErr ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{reviewErr}</div> : null}

  {!reviewLoading && !reviews.length ? (
    <div className="muted">No reviews yet.</div>
  ) : null}

  <div style={{ display: "grid", gap: 12 }}>
    {reviews.map((rv: any) => (
      <div
        key={rv?._id}
        style={{
          border: "1px solid #e9e9e9",
          borderRadius: 14,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>{rv?.name || "Customer"}</div>
            <div style={{ color: "#f59e0b", fontWeight: 900 }}>
              {renderStars(Number(rv?.rating || 0))}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            {rv?.isVerifiedPurchase ? (
              <div
                style={{
                  display: "inline-block",
                  background: "#ecfdf5",
                  color: "#065f46",
                  padding: "4px 8px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 6,
                }}
              >
                Verified Purchase
              </div>
            ) : null}
            <div className="muted" style={{ fontSize: 12 }}>
              {rv?.createdAt ? new Date(rv.createdAt).toLocaleDateString() : ""}
            </div>
          </div>
        </div>

        <p style={{ marginTop: 10, whiteSpace: "pre-line", lineHeight: 1.6 }}>
          {rv?.comment || "No comment"}
        </p>
      </div>
    ))}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}