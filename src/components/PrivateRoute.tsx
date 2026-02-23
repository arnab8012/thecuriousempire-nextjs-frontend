"use client";

import Navigate from "@/components/Navigate";
import { useLocation } from "@/utils/useLocation";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";

export default function PrivateRoute({ children }) {
  const { user, booting } = useAuth();
  const loc = useLocation();

  // ✅ boot চলছে → redirect না
  if (booting) return <div className="softBox">Loading...</div>;

  // ✅ token নাই বা user নাই → login
  const t = api.token();
  if (!t || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}