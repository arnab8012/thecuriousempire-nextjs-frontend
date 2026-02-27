"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function useLocation() {
  const pathname = usePathname();
  const sp = useSearchParams();

  const search = sp ? `?${sp.toString()}` : "";

  return {
    pathname: pathname || "",
    search: search || "",
    hash: "",
    state: null,
  };
}