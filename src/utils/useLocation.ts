"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useLocation() {
  const pathname = usePathname();
  const sp = useSearchParams();

  const search = useMemo(() => {
    const s = sp?.toString?.() || "";
    return s ? `?${s}` : "";
  }, [sp]);

  const state =
    typeof window !== "undefined" ? (window.history.state as any)?.usr : null;

  return { pathname, search, hash: "", state };
}