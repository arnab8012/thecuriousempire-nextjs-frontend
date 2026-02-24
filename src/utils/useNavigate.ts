"use client";

import { useRouter } from "next/navigation";

export function useNavigate() {
  const router = useRouter();

  return (to: string) => {
    router.push(to);
  };
}