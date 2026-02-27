"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import HomeCategories from "../components/HomeCategories";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const nav = useNavigate();

  const [cats, setCats] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  const absUrl = (u: any) => {
    if (!u) return "";
    const s = String(u);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${api.BASE}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  const bannerUrls = useMemo(() => {
    return (Array.isArray(banners) ? banners : [])
      .map((b) => (typeof b === "string" ? b : b?.url))
      .map(absUrl)
      .filter(Boolean);
  }, [banners]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const [c, r, p] = await Promise.all([
          api.get("/api/categories"),
          api.get("/api/banners"),
          api.get("/api/products"),
        ]);

        if (!alive) return;

        // ✅ always set arrays (never set object)
        const catList = Array.isArray(c?.categories) ? c.categories : [];
        const bannerList = Array.isArray(r?.banners) ? r.banners : [];
        const prodList = Array.isArray(p?.products) ? p.products : [];

        setCats(catList);
        setBanners(bannerList);
        setAllProducts(prodList);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % bannerUrls.length), 3500);
    return () => clearInterval(id);
  }, [bannerUrls.length]);

  // ✅ group products by categoryId (support _id OR id)
  const byCat = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of Array.isArray(allProducts) ? allProducts : []) {
      const cid =
        p?.category?._id ??
        p?.category?.id ??
        p?.categoryId ??
        p?.category ??
        null;

      const key = cid ? String(cid) : "";
      if (!key) continue;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [allProducts]);

  // ✅ helper: get category id safely
  const getCatId = (c: any) => String(c?._id ?? c?.id ?? c?.categoryId ?? c?.slug ?? "");

  return (
    <div className="page-enter">
      <Helmet>
        <title>The Curious Empire | Premium Shopping Experience In Bangladesh</title>

        <meta
          name="description"
          content="The Curious Empire offers premium shopping with curated products, fast delivery, and trusted quality—shop confidently every day."
        />

        <link rel="canonical" href="https://thecuriousempire.com/" />

        <meta property="og:title" content="The Curious Empire | Premium Shopping Experience In Bangladesh" />
        <meta
          property="og:description"
          content="The Curious Empire offers premium shopping with curated products, fast delivery, and trusted quality—shop confidently every day."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://thecuriousempire.com/" />
        <meta property="og:image" content="https://thecuriousempire.com/og.png" />
      </Helmet>

      <div className="container homeWrap">
        {/* ===== BANNER ===== */}
        {bannerUrls.length > 0 && (
          <div className="homeBanner">
            <div className="bannerSlideTrack" style={{ transform: `translateX(-${slide * 100}%)` }}>
              {bannerUrls.map((url, i) => (
                <div className="bannerSlide" key={i}>
                  <img src={url} className="bannerImg" alt="Banner" />
                </div>
              ))}
            </div>

            {bannerUrls.length > 1 && (
              <div className="bannerDots">
                {bannerUrls.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === slide ? "active" : ""}`}
                    onClick={() => setSlide(i)}
                    type="button"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="homeHeroText">
          <div className="homeHeroTitle">Welcome To The Curious Empire</div>
          <div className="homeHeroSub">Premium Shopping Experience – Your Curiosity, Our Collection🎪</div>
        </div>

        <HomeCategories cats={cats} />

        {/* ===== PRODUCTS SECTIONS (by category) ===== */}
        {loading ? (
          <div className="box" style={{ marginTop: 14 }}>
            Loading...
          </div>
        ) : cats.length === 0 ? null : (
          (Array.isArray(cats) ? cats : []).map((c) => {
            const cid = getCatId(c);
            if (!cid) return null;

            const items = byCat.get(cid) || [];
            if (!items.length) return null;

            const key = cid; // stable key

            return (
              <div key={key} style={{ marginTop: 14 }}>
                <div className="rowBetween" style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontWeight: 900 }}>{c?.name}</h3>
                  <Link className="seeMore" to={`/shop?category=${c?.slug || cid}`}>
                    See More →
                  </Link>
                </div>

                <div className="homeTwoGrid">
                  {items.slice(0, 4).map((p: any) => (
                    <ProductCard key={p?._id ?? p?.id ?? p?.slug ?? JSON.stringify(p)} p={p} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}