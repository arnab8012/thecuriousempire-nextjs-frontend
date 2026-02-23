"use client";

import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useEffect, useState } from "react";

export default function ProductCard({ p }) {
  const nav = useNavigate();
  const fav = useFavorites();
  const { user } = useAuth();
  const { add } = useCart();

  const isFav = Array.isArray(fav?.favIds) ? fav.favIds.includes(p?._id) : false;

  const img =
    Array.isArray(p?.images) && p.images.length
      ? p.images[0]
      : p?.image || "https://via.placeholder.com/300";

  const productLink = "/product/" + (p?._id || "");

  // ✅ toast
  const [toast, setToast] = useState({ show: false, text: "" });

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast({ show: false, text: "" }), 1200);
    return () => clearTimeout(t);
  }, [toast.show]);

  // ✅ prevent parent click (Home এর category button / wrapper)
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onFav = (e) => {
    stop(e);

    // ✅ login ছাড়া priyo না
    if (!user) {
      nav("/login");
      return;
    }
    fav?.toggle?.(p._id);
  };

  const onAddCart = (e) => {
    stop(e);

    add?.({
      productId: p?._id,
      title: p?.title,
      price: p?.price,
      image: img,
      variant: "",
      qty: 1,
    });

    // ✅ only toast (no navigation)
    setToast({ show: true, text: "✓ Added to cart" });
  };

  return (
    <div className="pCard">
      {/* ✅ bottom toast */}
      {toast.show && <div className="toastBottom">{toast.text}</div>}

      {/* image area */}
      <div className="pImgWrap">
        <Link to={productLink} onClick={(e) => e.stopPropagation()}>
          <img
            className="pImg"
            src={img}
            alt={p?.title || "product"}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://via.placeholder.com/300";
            }}
          />
        </Link>

        {/* favorite */}
        <button className="pFav" type="button" onClick={onFav} title="Priyo">
          {isFav ? "❤️" : "🤍"}
        </button>
      </div>

      {/* body + actions (সব একই wrapper এ থাকবে) */}
      <div className="pBody" onClick={(e) => e.stopPropagation()}>
        <Link
          to={productLink}
          className="pTitle"
          onClick={(e) => e.stopPropagation()}
        >
          {p?.title}
        </Link>

        {/* PRICE */}
        <div className="pcPriceRow">
          <span className="pcPrice">৳ {p?.price || 0}</span>

          {p?.compareAtPrice ? (
            <span className="pcCut">৳ {p.compareAtPrice}</span>
          ) : null}
        </div>

        {/* RATING + SOLD (optional) */}
        <div className="pcMetaRow">
          <span className="pcStar">⭐</span>
          <span className="pcRating">
            {Number(p?.rating || 0)}/5 ({Number(p?.ratingCount || 0)})
          </span>
          <span className="pcDot">•</span>
          <span className="pcSold">{Number(p?.soldCount || 0)} Sold</span>
        </div>

        <div className="pActions">
          <Link
            to={productLink}
            className="btnSoft"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>

          <button className="btnPrimary" type="button" onClick={onAddCart}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
