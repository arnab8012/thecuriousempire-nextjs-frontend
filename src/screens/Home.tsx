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

  const [cats, setCats] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  const absUrl = (u) => {
    if (!u) return "";
    const s = String(u);
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${api.BASE}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  const bannerUrls = useMemo(() => {
    return (banners || [])
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

        if (c?.ok) setCats(c.categories || []);
        if (r?.ok) setBanners(r.banners || []);
        if (p?.ok) setAllProducts(p.products || []);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, []);

  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % bannerUrls.length), 3500);
    return () => clearInterval(id);
  }, [bannerUrls.length]);

  // products group by category
  const byCat = useMemo(() => {
    const map = new Map();
    for (const p of allProducts) {
      const cid = p?.category?._id;
      if (!cid) continue;
      if (!map.has(cid)) map.set(cid, []);
      map.get(cid).push(p);
    }
    return map;
  }, [allProducts]);

return (
    <div className="page-enter">
      <Helmet>
        <title>The Curious Empire | Premium Shopping Experience In Bangladesh</title>

        <meta
          name="description"
          content="The Curious Empire offers premium shopping with curated products, fast delivery, and trusted quality—shop confidently every day."
        />

        <link rel="canonical" href="https://thecuriousempire.com/" />

        {/* Open Graph */}
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
            <div
              className="bannerSlideTrack"
              style={{ transform: `translateX(-${slide * 100}%)` }}
            >
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

        {/* ===== TEXT BELOW BANNER ===== */}
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
          cats.map((c) => {
            const items = byCat.get(c._id) || [];
            if (!items.length) return null;

            return (
              <div key={c._id} style={{ marginTop: 14 }}>
                <div className="rowBetween" style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontWeight: 900 }}>{c.name}</h3>
                  <Link className="seeMore" to={`/shop?category=${c.slug || c._id}`}>
                    See More →
                  </Link>
                </div>

                <div className="homeTwoGrid">
                  {items.slice(0, 4).map((p) => (
                    <ProductCard key={p._id} p={p} />
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
