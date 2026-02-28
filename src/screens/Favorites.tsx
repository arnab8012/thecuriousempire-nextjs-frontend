"use client";

// src/pages/Favorites.jsx

import Link from "@/components/Link";
import { useLocation } from "@/utils/useLocation";
import { useNavigate } from "@/utils/useNavigate";
import { useEffect, useMemo, useState } from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../api/api";
import useNoIndex from "../utils/useNoIndex";

export default function Favorites() {
  useNoIndex("noindex, nofollow");
  const nav = useNavigate();
  const { pathname } = useLocation();
  const fav = useFavorites();
  const { user } = useAuth();
  const { buyNow } = useCart();

  // ✅ admin panel এ hide
  if (pathname.startsWith("/admin")) return null;

  const favIds = Array.isArray(fav?.favIds) ? fav.favIds : [];

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  const formatBDT = (n) => `৳ ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

  // ✅ helper: product এ variant থাকলে first variant pick করবে
  const pickVariant = (p) => {
    const v = p?.variants?.[0]?.name;
    return v ? String(v) : "";
  };

  // ✅ favIds পরিবর্তন হলে product details load
  useEffect(() => {
    let alive = true;

    async function load() {
      if (!favIds.length) {
        setProducts([]);
        return;
      }

      setLoading(true);

      try {
        const r = await api.get("/api/products");
        if (!alive) return;

        if (r?.ok && Array.isArray(r?.products)) {
          const map = new Map(r.products.map((p) => [String(p._id), p]));
          const list = favIds.map((id) => map.get(String(id))).filter(Boolean);
          setProducts(list);
        } else {
          setProducts([]);
        }
      } catch {
        if (!alive) return;
        setProducts([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [favIds.join("|")]);

  const total = favIds.length;

  const doRemove = (id) => {
    if (fav?.remove) return fav.remove(id);
    if (fav?.removeFav) return fav.removeFav(id);
    if (fav?.removeFavorite) return fav.removeFavorite(id);
    if (fav?.toggle) return fav.toggle(id);
    if (fav?.toggleFav) return fav.toggleFav(id);
  };

  const doClear = () => {
    if (fav?.clear) return fav.clear();
    if (fav?.clearAll) return fav.clearAll();
    if (fav?.reset) return fav.reset();

    // fallback: সব id remove
    favIds.forEach((id) => doRemove(id));
  };

  const firstFavId = favIds?.[0] ? String(favIds[0]) : null;

  const firstFavProduct = useMemo(() => {
    if (!firstFavId) return null;
    return products.find((p) => String(p?._id) === firstFavId) || null;
  }, [firstFavId, products]);

  // ✅ Favorites থেকে Checkout => ProductDetails এ না গিয়ে Checkout (buy mode)
  const checkoutFirst = () => {
    if (!user) return nav("/login");

    if (firstFavProduct?._id) {
      const v = pickVariant(firstFavProduct); // ✅ FIX: empty variant না পাঠিয়ে first variant পাঠানো
      buyNow(firstFavProduct, v, 1);
      nav("/checkout?mode=buy");
      return;
    }
    nav("/shop");
  };

  return (
    <div className="container favPage">
      <div className="favHead">
        <div>
          <h2 className="favTitle" style={{ margin: 0 }}>
            My Favorites
          </h2>

          <div className="favSub">
            {user?.phone || user?.email || "Guest"} — <b>Total: {total}</b>
          </div>
        </div>

        <button className="favBackBtn" type="button" onClick={() => nav(-1)}>
          ← Back
        </button>
      </div>

      {!total ? (
        <div className="favEmpty">
          No favorites yet. <Link to="/shop">Go to shop</Link>
        </div>
      ) : (
        <>
          <div className="favTopActions">
            <button type="button" className="favPrimaryBtn" onClick={checkoutFirst}>
              Checkout (First Favorite)
            </button>

            <button type="button" className="favGhostBtn" onClick={doClear}>
              Clear All
            </button>
          </div>

          {loading ? (
            <div className="favEmpty">Loading favorites…</div>
          ) : products.length ? (
            <div className="favList">
              {products.map((p, idx) => {
                const id = String(p?._id || "");
                const title = p?.title || "Product";
                const price = Number(p?.price) || 0;
                const img =
                  p?.images?.[0] ||
                  p?.image ||
                  p?.thumb ||
                  "https://via.placeholder.com/320x240?text=Product";

                return (
                  <div className="favItem" key={id || `${idx}`}>
                    <Link to={`/product/${id}`} className="favThumb">
                      <img
                        src={img}
                        alt={title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/320x240?text=Product";
                        }}
                      />
                    </Link>

                    <div className="favInfo">
                      <Link to={`/product/${id}`} className="favItemTitle">
                        {title}
                      </Link>

                      <div className="favPrice">{formatBDT(price)}</div>

                      <div className="favBtns">
                        <Link to={`/product/${id}`} className="favViewBtn">
                          View
                        </Link>

                        {/* ✅ Optional: প্রতিটা favorite item থেকে direct Buy Now */}
                        <button
                          type="button"
                          className="favPrimaryBtn"
                          onClick={() => {
                            if (!user) return nav("/login");
                            const v = pickVariant(p); // ✅ FIX: first variant
                            buyNow(p, v, 1);
                            nav("/checkout?mode=buy");
                          }}
                        >
                          Buy Now
                        </button>

                        <button type="button" className="favRemoveBtn" onClick={() => doRemove(id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="favEmpty">
              Favorites আছে (IDs: {favIds.length}) কিন্তু product list এ match হয়নি।
              <br />
              (সম্ভবত /api/products এ এই আইডি গুলো নেই)
            </div>
          )}
        </>
      )}
    </div>
  );
}