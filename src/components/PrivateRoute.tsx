"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { user, booting } = useAuth();

  useEffect(() => {
    if (booting) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const qs = sp?.toString() ? `?${sp.toString()}` : "";
    const next = `${pathname || "/"}${qs}`;

    if (!token || !user) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [booting, user, router, pathname, sp]);

  if (booting) return null;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  if (!token || !user) return null;

  return <>{children}</>;
}