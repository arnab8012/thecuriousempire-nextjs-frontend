"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "@/utils/useParams";
import { useNavigate } from "@/utils/useNavigate";
import { api } from "../api/api";
import { useCart } from "../context/CartContext";
import { Helmet } from "react-helmet-async";

export default function ProductDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { add, buyNow } = useCart();

  const [p, setP] = useState(null);
  const [variant, setVariant] = useState("");
  const [qty, setQty] = useState(1);

  // ✅ gallery state
  const [idx, setIdx] = useState(0);

  // ✅ toast
  const [toast, setToast] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      const r = await api.get(`/api/products/${id}`);
      if (!alive) return;

      if (r.ok) {
        setP(r.product);
        const firstVar = r.product?.variants?.[0]?.name || "";
        setVariant(firstVar);
        setQty(1);
        setIdx(0);
      } else {
        alert(r.message || "Not found");
      }
    })();

    return () => (alive = false);
  }, [id]);

  const imgs = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    return arr.filter(Boolean);
  }, [p?.images]);

  // ✅ auto image change
  useEffect(() => {
    if (imgs.length <= 1) return;
    const t = setInterval(() => {
      setIdx((x) => (x + 1) % imgs.length);
    }, 2500);
    return () => clearInterval(t);
  }, [imgs.length]);

  if (!p) return <div className="container">Loading...</div>;

  const mainImg = imgs[idx] || "https://via.placeholder.com/800x500?text=Product";

  const cartItem = {
    productId: p._id,
    title: p.title,
    image: imgs[0] || mainImg,
    variant,
    qty,
    price: p.price
  };

  const prev = () => {
    if (!imgs.length) return;
    setIdx((x) => (x - 1 + imgs.length) % imgs.length);
  };

  const next = () => {
    if (!imgs.length) return;
    setIdx((x) => (x + 1) % imgs.length);
  };

  const showToast = (msg) => {
    setToast(msg);
    // একাধিক click করলে আগের timeout cancel
    if (window.__pd_toast_t) window.clearTimeout(window.__pd_toast_t);
    window.__pd_toast_t = window.setTimeout(() => setToast(""), 1200);
  };

  // =========================
  // ✅ SEO (Helmet) values
  // =========================
  const canonical = p?._id
    ? `https://thecuriousempire.com/product/${p._id}`
    : `https://thecuriousempire.com/product/${id}`;

  const title = p?.title ? `${p.title} | The Curious Empire` : "Product | The Curious Empire";

  const descRaw =
    p?.description ||
    "Shop premium products at The Curious Empire. Quality products with fast delivery.";

  // ✅ description ছোট (Google snippet friendly)
  const desc = String(descRaw).replace(/\s+/g, " ").trim().slice(0, 180);

  const ogImg = imgs[0] || "https://thecuriousempire.com/og.png";

  // ✅ variant-based stock
  const selectedVar = (p?.variants || []).find((v) => v.name === variant);
  const inStock = (selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0) > 0;
const availableStock = selectedVar?.stock ?? p?.variants?.[0]?.stock ?? 0;
const canBuy = availableStock > 0 && qty <= availableStock;

  const price = Number(p?.price || 0);
  const brandName = "The Curious Empire";

  // ✅ Product JSON-LD schema
  const productSchema = p?._id
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.title,
        image: (imgs?.length ? imgs : [ogImg]).filter(Boolean),
        description: desc,
        sku: String(p._id),
        brand: { "@type": "Brand", name: brandName },
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "BDT",
          price: price || undefined,
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition"
        }
      }
    : null;

  return (
    <>
      {/* ✅ SEO HEAD TAGS */}
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImg} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImg} />

        {/* JSON-LD Product Schema */}
        {productSchema && (
          <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        )}
      </Helmet>

      <div className="container">
        <div className="pd">
          {/* ✅ LEFT: Gallery */}
          <div>
            <div style={{ position: "relative" }}>
              <img
                className="pdImg"
                src={mainImg}
                alt={p.title}
                style={{ width: "100%", borderRadius: 14 }}
              />

              {/* ✅ arrow buttons */}
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
                      fontSize: 20
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
                      fontSize: 20
                    }}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}

              {/* ✅ dots */}
              {imgs.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 10,
                    display: "flex",
                    justifyContent: "center",
                    gap: 8
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
                        background: i === idx ? "#111" : "rgba(0,0,0,0.25)"
                      }}
                      aria-label={`img-${i}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ✅ thumbnails */}
            {imgs.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 12,
                  overflowX: "auto",
                  paddingBottom: 6
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
                      flex: "0 0 auto"
                    }}
                    title={`Image ${i + 1}`}
                    aria-label={`Thumbnail ${i + 1}`}
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

          {/* ✅ RIGHT: Details */}
          <div className="pdRight" style={{ position: "relative" }}>
            {/* ✅ Toast */}
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
                  marginBottom: 10
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
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="input"
                >
                  {p.variants.map((v, i) => (
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
                  aria-label="Decrease quantity"
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
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pdBtns">
              {/* ✅ Add to Cart => cart এ add হবে, কিন্তু /cart এ যাবে না */}
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

              {/* ✅ Buy Now => cart এ add হবে না */}
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
              <p className="product-description muted">
  {p.description || "No description yet."}
</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
