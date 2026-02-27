"use client";

import { useSearchParams } from "next/navigation";

export function useParams<T extends Record<string, string>>() {
  const sp = useSearchParams();
  const out: Record<string, string> = {};

  sp.forEach((v, k) => {
    out[k] = v;
  });

  return out as T;
}