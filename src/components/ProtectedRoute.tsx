"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, booting, refreshMe } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ✅ read token safely (client only)
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem("token") || "";
    } catch {
      return "";
    }
  }, []);

  // ✅ prevent infinite refresh loop
  const [triedRefresh, setTriedRefresh] = useState(false);

  useEffect(() => {
    if (booting) return;

    const qs = sp?.toString() ? `?${sp.toString()}` : "";
    const next = `${pathname}${qs}`;

    // ✅ no token => go login
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    // ✅ token আছে কিন্তু user নাই => wait + refresh once (DON'T redirect yet)
    if (token && !user && !triedRefresh) {
      setTriedRefresh(true);

      (async () => {
        const r = await refreshMe?.();
        if (!r?.ok) {
          try {
            window.localStorage.removeItem("token");
          } catch {}

          router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
      })();
    }
  }, [booting, token, user, triedRefresh, refreshMe, router, pathname, sp]);

  // ✅ while booting OR waiting for refresh -> show loading
  if (booting) return <div className="softBox">Loading...</div>;

  // ✅ token missing => (redirect effect will run), show nothing
  if (!token) return null;

  // ✅ token আছে কিন্তু user এখনো নেই => show loading (refresh in progress)
  if (!user) return <div className="softBox">Loading...</div>;

  return <>{children}</>;
}