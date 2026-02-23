"use client";

// src/utils/useNoIndex.js
import { useEffect } from "react";

/**
 * SPA friendly noindex:
 * - meta[name="robots"] না থাকলে create করবে
 * - content সেট করবে
 * - page change হলে আগের content restore / remove করবে
 */
export default function useNoIndex(content = "noindex, nofollow") {
  useEffect(() => {
    let tag = document.querySelector('meta[name="robots"]');
    const prev = tag?.getAttribute("content") || null;

    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "robots");
      document.head.appendChild(tag);
    }

    tag.setAttribute("content", content);

    return () => {
      const current = document.querySelector('meta[name="robots"]');
      if (!current) return;
      if (prev) current.setAttribute("content", prev);
      else current.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}