"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api/api";

type User = any;

type AuthContextValue = {
  user: User | null;
  token: string;
  loading: boolean;

  login: (phone: string, password: string) => Promise<{ ok: boolean; message?: string }>;

  // ✅ REGISTER যোগ করা হলো (Register page crash বন্ধ হবে)
  register: (payload: {
    name: string;
    phone: string;
    password: string;
    gender?: string;
  }) => Promise<{ ok: boolean; message?: string }>;

  logout: () => void;
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

        // যদি তোমার backend এ /api/auth/me থাকে, চাইলে enable করো:
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
    const res = await api.post("/api/auth/login", { phone, password });

    if (res?.ok && res?.token) {
      safeSetLS("token", String(res.token));
      setToken(String(res.token));
      setUser(res.user || null);
      return { ok: true };
    }

    return { ok: false, message: res?.message || "Login failed" };
  };

  // ✅ register ফাংশন (Register page এ t is not a function বন্ধ হবে)
  const register = async (payload: { name: string; phone: string; password: string; gender?: string }) => {
    const res = await api.post("/api/auth/register", payload);

    // অনেক backend register এর পর token দেয়, থাকলে save করবো
    if (res?.ok && res?.token) {
      safeSetLS("token", String(res.token));
      setToken(String(res.token));
      setUser(res.user || null);
    }

    return { ok: !!res?.ok, message: res?.message || (res?.ok ? "Registered" : "Register failed") };
  };

  const logout = () => {
    safeRemoveLS("token");
    setToken("");
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  // Provider missing হলেও crash করবে না
  return {
    user: null,
    token: "",
    loading: false,
    login: async () => ({ ok: false, message: "AuthProvider missing" }),
    register: async () => ({ ok: false, message: "AuthProvider missing" }),
    logout: () => {},
  };
}