"use client";

import { useEffect, useState } from "react";
import Navigate from "@/components/Navigate";
import { useLocation } from "@/utils/useLocation";
import { api } from "../api/api";

export default function AdminRoute({ children }) {
  const loc = useLocation();
  const [ok, setOk] = useState(null); // null=checking, true/false=done

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || "";

    // token না থাকলে সাথে সাথে login এ পাঠাবে
    if (!token) {
      setOk(false);
      return;
    }

    // ✅ token valid কিনা backend এ check করবে
    (async () => {
      try {
        // তোমার backend এ যদি /api/admin-auth/me না থাকে, তবু এইটা safe:
        // - 200 হলে ok true
        // - 401/404 হলে ok false
        const r = await api.getAuth("/api/admin-auth/me", token);
        if (r?.ok) setOk(true);
        else setOk(false);
      } catch {
        setOk(false);
      }
    })();
  }, []);

  // loading state
  if (ok === null) {
    return (
      <div style={{ padding: 20, fontSize: 16 }}>
        Checking admin...
      </div>
    );
  }

  if (!ok) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}