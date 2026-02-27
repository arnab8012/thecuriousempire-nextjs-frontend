"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, booting } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    if (booting) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : "";

    if (!token || !user) {
      const qs = sp?.toString() ? `?${sp.toString()}` : "";
      const next = `${pathname}${qs}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [booting, user, router, pathname, sp]);

  if (booting) {
    return <div className="softBox">Loading...</div>;
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  if (!token || !user) return null;

  return <>{children}</>;
}