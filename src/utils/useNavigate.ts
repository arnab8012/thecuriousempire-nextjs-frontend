"use client";

import { useRouter } from "next/navigation";

// React Router compatible navigate()
export function useNavigate() {
  const router = useRouter();
  return (to, options = {}) => {
    const href = typeof to === "string" ? to : String(to);
    if (options?.replace) router.replace(href);
    else router.push(href);
  };
}
