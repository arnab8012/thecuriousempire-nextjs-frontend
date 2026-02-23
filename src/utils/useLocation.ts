"use client";

import { usePathname, useSearchParams } from "next/navigation";

// React Router compatible location object
export function useLocation() {
  const pathname = usePathname() || "/";
  const sp = useSearchParams();
  const search = sp?.toString() ? `?${sp.toString()}` : "";
  return { pathname, search };
}
