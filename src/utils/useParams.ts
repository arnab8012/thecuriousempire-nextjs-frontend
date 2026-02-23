"use client";

import { useParams as useNextParams } from "next/navigation";

export function useParams() {
  const p = useNextParams() || {};
  // next returns string | string[]; keep string
  const out = {};
  for (const k of Object.keys(p)) {
    const v = p[k];
    out[k] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}
