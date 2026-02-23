"use client";

import { memo } from "react";
import { useNavigate } from "@/utils/useNavigate";

function HomeCategories({ cats }) {
  const nav = useNavigate();

  if (!Array.isArray(cats) || cats.length === 0) return null;

  return (
    <div className="homeSection">
      {/* Header */}
      <div className="rowBetween" style={{ alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Categories</h3>

        <button
          type="button"
          className="btnGhost"
          onClick={() => nav("/shop")}
          style={{ padding: "8px 12px" }}
        >
          See more
        </button>
      </div>

      {/* Categories Row (RTL) */}
      <div className="catRow">
        {cats.map((c) => (
          <button
            key={c._id} // ✅ stable key
            className="catItem"
            type="button"
            onClick={() => nav(`/shop?category=${c._id}`)}
          >

         <div className="catIcon premiumIcon">
  {c.icon ? (
    <img
      src={c.icon}
      alt={c.name}
      className="catImg"
      loading="lazy"
    />
  ) : (
    <i
      className={
        c.name === "Mobile Accessories"
          ? "ph ph-device-mobile ph-bold"
          : c.name === "HeadphoneS"
          ? "ph ph-headphones ph-bold"
          : c.name === "Bluetooth Speakers"
          ? "ph ph-speaker-high ph-bold"
          : c.name === "Data Cables"
          ? "ph ph-plug ph-bold"
          : "ph ph-package ph-bold"
      }
    ></i>
  )}
</div>

      <div className="catName">{c.name}</div>
          </button>
        ))}
      </div>

      {/* ✅ Bottom 2 Options */}
      <div className="catOptions">
        <div className="optionCard">🚚 <span>Free Delivery</span></div>
        <div className="optionCard">🛍️ <span>Best Offers</span></div>
      </div>
    </div>
  );
}

export default memo(HomeCategories);