"use client";

import Link from "@/components/Link";
import { useLocation } from "@/utils/useLocation";
import { useNavigate } from "@/utils/useNavigate";
import { useState } from "react";

export default function Navbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  // ❌ Admin panel এ navbar দেখাবে না
  if (pathname.startsWith("/admin")) return null;

  const [q, setQ] = useState("");

  const doSearch = (e) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) return;
    nav(`/shop?q=${encodeURIComponent(v)}`);
  };

  return (
    <header className="topbar">
      <div className="topbarInner">
        {/* BRAND LOGO */}
        <Link to="/" className="topBrand">
          <img src="/logo.png" alt="The Curious Empire" className="topLogo" />
        </Link>

        {/* BRAND TEXT (IMAGE STYLE) */}
        <div className="brandTextWrap">
          <span className="brandTextMain">The Curious Empire</span>
          <span className="brandTextSub">Premium Shopping Experience</span>
        </div>

        {/* SEARCH */}
        <form className="topSearch" onSubmit={doSearch}>
          <div className="topSearchBox">
            <input
              className="topSearchInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
            />
            <button className="topSearchBtn" type="submit">
              🔍
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}