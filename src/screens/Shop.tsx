"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@/utils/useLocation";
import Link from "@/components/Link";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import { Helmet } from "react-helmet-async";

export default function Shop() {
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const category = params.get("category") || "";
  const q = (params.get("q") || "").trim();

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState("");
  const [limit, setLimit] = useState(12);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setFetchErr("");
        setLoading(true);

        const url = category
          ? `/api/products?category=${encodeURIComponent(category)}`
          : "/api/products";

        const r = await api.get(url);
        if (!alive) return;

        if (r?.ok) {
          const items = Array.isArray(r.products) ? r.products : [];
          setAll(items);
          if (items.length === 0) {
            setFetchErr("No products available right now. Please check back soon.");
          }
        } else {
          setAll([]);
          setFetchErr(r?.message || "Could not load products. Please try again.");
        }
      } catch (e) {
        if (alive) {
          setAll([]);
          setFetchErr(e?.message || "Network error. Please try again.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [category]);

  const filtered = useMemo(() => {
    const text = q.toLowerCase();
    if (!text) return all;

    return (all || []).filter((p) => {
      const title = String(p?.title || "").toLowerCase();
      const desc = String(p?.description || "").toLowerCase();
      const catName = String(p?.category?.name || "").toLowerCase();
      return title.includes(text) || desc.includes(text) || catName.includes(text);
    });
  }, [all, q]);

  const visible = useMemo(() => filtered.slice(0, limit), [filtered, limit]);
  const canMore = visible.length < filtered.length;

  useEffect(() => {
    setLimit(12);
  }, [q, category]);

  // SEO
  const canonical = `https://thecuriousempire.com/shop${search || ""}`;
  const title = q ? `Search "${q}" | The Curious Empire` : "Shop | The Curious Empire";
  const desc = q
    ? `Search results for "${q}" at The Curious Empire.`
    : category
    ? `Shop ${category} products at The Curious Empire.`
    : "Shop premium products at The Curious Empire.";

  const introTitle = "Shop — The Curious Empire";
  const introDesc =
    "Browse products from The Curious Empire. Premium shopping experience with quality & care. Find items by category or search.";

  return (
    <div className="page-enter">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://thecuriousempire.com/og.png" />
      </Helmet>

      <div className="container" style={{ paddingBottom: 140 }}>
        <h1 style={{ fontSize: 26, margin: "10px 0" }}>{introTitle}</h1>
        <p style={{ marginTop: 0, opacity: 0.85 }}>{introDesc}</p>

        <div className="shopHead" style={{ marginTop: 10 }}>
          <div>
            <div className="shopTitle">Products</div>
            <div className="shopSub">
              {q ? (
                <>
                  Search: <b>{q}</b> —{" "}
                </>
              ) : null}
              {category ? (
                <>
                  Category: <b>{category}</b> —{" "}
                </>
              ) : null}
              Showing {visible.length} / {filtered.length}
            </div>
          </div>

          <Link className="btnSoftLink" to="/">
            ← Back
          </Link>
        </div>

        {loading ? (
          <div className="softBox">
            <b>Loading products…</b>
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              Please wait a moment while we fetch the latest items.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="softBox">
            <b>No products found</b>
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              {q
                ? `No results for "${q}". Try a different keyword.`
                : fetchErr || "We’re updating our shop. Please check back soon."}
            </div>

            <div style={{ marginTop: 10 }}>
              <Link className="btnSoftLink" to="/shop">
                Reset filters
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="homeTwoGrid">
  {visible.map((p) => (
    <ProductCard key={p._id} p={p} />
  ))}
</div>
              ))}
            </div>

            {canMore ? (
              <div className="shopMoreWrap">
                <button
                  className="btnPrimary"
                  type="button"
                  onClick={() => setLimit((x) => x + 12)}
                >
                  See more
                </button>
              </div>
            ) : null}

            <div style={{ marginTop: 18, opacity: 0.75, fontSize: 14 }}>
              Looking for something specific? Use the search box or browse categories to find products.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
