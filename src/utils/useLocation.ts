"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = useMemo(() => {
    const s = searchParams?.toString?.() || "";
    return s ? `?${s}` : "";
  }, [searchParams]);

  // React Router like: location.state (best-effort via history.state)
  const state =
    typeof window !== "undefined" ? (window.history.state as any)?.usr : null;

  return {
    pathname,
    search,
    hash: "",
    state,
  };
}