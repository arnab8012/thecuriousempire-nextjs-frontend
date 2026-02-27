"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/api/api";

type AuthUser = {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
};

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

const TOKEN_KEY = "token";
const USER_KEY = "user_v1";

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const t = localStorage.getItem(TOKEN_KEY);
    const u = safeJsonParse<AuthUser | null>(localStorage.getItem(USER_KEY), null);

    setToken(t);
    setUser(u);
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      // ✅ তোমার backend endpoint এখানে সেট করো
      // ধরলাম: POST /auth/login  -> { token, user }
      const data = await apiFetch<{ token: string; user: AuthUser; message?: string }>(
        "/auth/login",
        {
          method: "POST",
          auth: false,
          body: JSON.stringify({ phone, password }),
        }
      );

      if (!data?.token) return { ok: false, message: data?.message || "Token missing" };

      setToken(data.token);
      setUser(data.user || null);

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user || null));

      return { ok: true };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Login failed" };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const value = useMemo<AuthCtx>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}