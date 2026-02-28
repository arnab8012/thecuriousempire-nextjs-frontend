"use client";

import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useEffect, useMemo, useState } from "react";

function pid(p: any) {
  return String(p?._id ?? p?.id ?? p?.slug ?? "");
}

function safeImg(p: any) {
  const img =
    (Array.isArray(p?.images) && p.images.length ? p.images[0] : null) ||
    p?.image ||
    "https://via.placeholder.com/300";
  return String(img);
}

export default function ProductCard({ p }: { p: any }) {
  const nav = useNavigate();
  const fav = useFavorites();
  const { user } = useAuth();
  const cart = useCart();

  const id = useMemo(() => pid(p), [p]);
  const img = useMemo(() => safeImg(p), [p]);

  // যদি id নাই থাকে, link ভাঙবে না (সেফ)
  const productLink = id ? `/product/${id}` : "/shop";

  const isFav = useMemo(() => {
    const list = Array.isArray(fav?.favIds) ? fav.favIds : [];
    return id ? list.includes(id) : false;
  }, [fav?.favIds, id]);

  // ✅ toast
  const [toast, setToast] = useState({ show: false, text: "" });

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast({ show: false, text: "" }), 1200);
    return () => clearTimeout(t);
  }, [toast.show]);

  const stop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onFav = (e: any) => {
    stop(e);

    if (!id) return;

    // ✅ login ছাড়া priyo না
    if (!user) {
      nav("/login");
      return;
    }

    fav?.toggle?.(id);
  };

  const onAddCart = (e: any) => {
    stop(e);

    if (!id) {
      setToast({ show: true, text: "Product not available" });
      return;
    }

    cart?.add?.({
      productId: id, // ✅ _id/id দুটোই handle
      title: p?.title || "",
      price: Number(p?.price || 0),
      image: img,
      variant: String(p?.variants?.[0]?.name || ""),
      qty: 1,
    });

    setToast({ show: true, text: "✓ Added to cart" });
  };

  return (
    <div className="pCard">
      {toast.show && <div className="toastBottom">{toast.text}</div>}

      <div className="pImgWrap">
        <Link to={productLink} onClick={(e: any) => e.stopPropagation()}>
          <img
            className="pImg"
            src={img}
            alt={p?.title || "product"}
            loading="lazy"
            onError={(e: any) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://via.placeholder.com/300";
            }}
          />
        </Link>

        <button className="pFav" type="button" onClick={onFav} title="Priyo">
          {isFav ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="pBody" onClick={(e: any) => e.stopPropagation()}>
        <Link to={productLink} className="pTitle" onClick={(e: any) => e.stopPropagation()}>
          {p?.title}
        </Link>

        <div className="pcPriceRow">
          <span className="pcPrice">৳ {Number(p?.price || 0)}</span>
          {p?.compareAtPrice ? <span className="pcCut">৳ {Number(p.compareAtPrice)}</span> : null}
        </div>

        <div className="pcMetaRow">
          <span className="pcStar">⭐</span>
          <span className="pcRating">
            {Number(p?.rating || 0)}/5 ({Number(p?.ratingCount || 0)})
          </span>
          <span className="pcDot">•</span>
          <span className="pcSold">{Number(p?.soldCount || 0)} Sold</span>
        </div>

        <div className="pActions">
          <Link to={productLink} className="btnSoft" onClick={(e: any) => e.stopPropagation()}>
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