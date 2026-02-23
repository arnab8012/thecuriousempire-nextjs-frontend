"use client";

import { memo } from "react";
import { useNavigate } from "@/utils/useNavigate";

function CategoryRow({ cats }) {
  const nav = useNavigate();

  return (
    <div className="catRow">
      {cats.map((c) => (
        <button
          key={c._id}   // ❗ index না, শুধু _id
          className="catItem"
          type="button"
          onClick={() => nav(`/shop?category=${c._id}`)}
        >
          <div className="catIcon">
            <img src={c.image} alt={c.name} />
          </div>
          <div className="catName">{c.name}</div>
        </button>
      ))}
    </div>
  );
}

export default memo(CategoryRow); // 🔒 re-render lock