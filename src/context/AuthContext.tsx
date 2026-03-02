"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api/api";

type User = any;

type AuthContextValue = {
  user: User | null;
  token: string;
  loading: boolean;

  login: (phone: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;

  // দরকার হলে register add করবে পরে
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function safeGetLS(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
function safeSetLS(key: string, val: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, val);
  } catch {}
}
function safeRemoveLS(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string>(() => safeGetLS("token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // App load এ token থাকলে user আনতে পারো (তোমার backend route থাকলে)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const t = safeGetLS("token");
        if (!t) {
          if (!alive) return;
          setUser(null);
          setToken("");
          return;
        }

        // যদি তোমার backend এ profile endpoint থাকে:
        // const me = await api.getAuth("/api/auth/me", t);
        // if (alive && me?.ok) setUser(me.user || null);

        if (!alive) return;
        setToken(t);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const login = async (phone: string, password: string) => {
    // ⚠️ এখানে endpoint তোমার backend অনুযায়ী লাগবে।
    // বেশিরভাগ ক্ষেত্রে এটা থাকে: /api/auth/login
    const res = await api.post("/api/auth/login", { phone, password });

    if (res?.ok && res?.token) {
      safeSetLS("token", String(res.token));
      setToken(String(res.token));
      setUser(res.user || null);
      return { ok: true };
    }

    return { ok: false, message: res?.message || "Login failed" };
  };

  const logout = () => {
    safeRemoveLS("token");
    setToken("");
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Provider missing হলে crash না করে পরিষ্কার error দিবে
    return {
      user: null,
      token: "",
      loading: false,
      login: async () => ({ ok: false, message: "AuthProvider missing" }),
      logout: () => {},
    };
  }
  return ctx;
}