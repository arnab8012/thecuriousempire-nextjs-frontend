"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import ProductCard from "../components/ProductCard";
import HomeCategories from "../components/HomeCategories";

type Props = {
  cats?: any[];
  banners?: any[];
  products?: any[];
  apiBase?: string;
};

export default function HomeClient({
  cats = [],
  banners = [],
  products = [],
  apiBase = "",
}: Props) {
  const [slide, setSlide] = useState(0);

  const absUrl = (u: any) => {
    if (!u) return "";
    const s = String(u);

    // already absolute
    if (s.startsWith("http://") || s.startsWith("https://")) return s;

    // if apiBase missing, return as-is (prevents breaking UI)
    if (!apiBase) return s;

    const base = apiBase.replace(/\/$/, "");
    return `${base}${s.startsWith("/") ? "" : "/"}${s}`;
  };

  // ✅ make category icon absolute if it is relative (prevents broken icon)
  const catsFixed = useMemo(() => {
    const arr = Array.isArray(cats) ? cats : [];
    return arr.map((c) => ({
      ...c,
      icon: c?.icon ? absUrl(c.icon) : c?.icon,
    }));
  }, [cats, apiBase]);

  const bannerUrls = useMemo(() => {
    return (Array.isArray(banners) ? banners : [])
      .map((b) => (typeof b === "string" ? b : b?.url))
      .map(absUrl)
      .filter(Boolean);
  }, [banners, apiBase]);

  useEffect(() => {
    if (bannerUrls.length <= 1) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % bannerUrls.length),
      3500
    );
    return () => clearInterval(id);
  }, [bannerUrls.length]);

  const byCat = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of Array.isArray(products) ? products : []) {
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
  }, [products]);

  const getCatId = (c: any) =>
    String(c?._id ?? c?.id ?? c?.categoryId ?? c?.slug ?? "");

  return (
    <div className="page-enter">
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

        <div className="homeHeroText">
          <div className="homeHeroTitle">Welcome To The Curious Empire</div>
          <div className="homeHeroSub">
            Premium Shopping Experience – Your Curiosity, Our Collection🎪
          </div>
        </div>

        <HomeCategories cats={catsFixed} />

        {/* ===== PRODUCTS SECTIONS (by category) ===== */}
        {Array.isArray(catsFixed) && catsFixed.length > 0
          ? catsFixed.map((c) => {
              const cid = getCatId(c);
              if (!cid) return null;

              const items = byCat.get(cid) || [];
              if (!items.length) return null;

              return (
                <div key={cid} style={{ marginTop: 14 }}>
                  <div className="rowBetween" style={{ marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontWeight: 900 }}>{c?.name}</h3>
                    <Link className="seeMore" to={`/shop?category=${c?.slug || cid}`}>
                      See More →
                    </Link>
                  </div>

                  <div className="homeTwoGrid">
                    {items.slice(0, 4).map((p: any) => (
                      <ProductCard
                        key={p?._id ?? p?.id ?? p?.slug ?? JSON.stringify(p)}
                        p={p}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
}