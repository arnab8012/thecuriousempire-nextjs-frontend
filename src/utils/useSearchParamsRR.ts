"use client";

import { useSearchParams } from "next/navigation";

// Minimal React Router compatible signature: const [sp] = useSearchParams();
export function useSearchParamsRR() {
  const sp = useSearchParams();
  const setter = () => {
    // not used in this project
  };
  return [sp, setter];
}
