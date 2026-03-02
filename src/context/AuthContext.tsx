"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api/api";

type User = any;

type AuthContextValue = {
  user: User | null;
  token: string;
  loading: boolean;

  login: (phone: string, password: string) => Promise<{ ok: boolean; message?: string }>;

  register: (payload: {
    name: string;
    phone: string;
    password: string;
    gender?: string;
  }) => Promise<{ ok: boolean; message?: string }>;

  logout: () => void;

  // ✅ optional: force reload user from server
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "auth_user_v1";

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

function safeGetUser(): User | null {
  try {
    const raw = safeGetLS(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function safeSetUser(u: any) {
  try {
    safeSetLS(USER_KEY, JSON.stringify(u ?? null));
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string>(() => safeGetLS(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => safeGetUser());
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ server থেকে user sync (endpoint থাকলে)
  const refreshMe = async () => {
    const t = safeGetLS(TOKEN_KEY);
    if (!t) {
      setUser(null);
      setToken("");
      safeRemoveLS(USER_KEY);
      return;
    }

    // 🔥 এখানে তোমার backend এ যেটা আছে সেটা দাও
    // সাধারণত থাকে: /api/auth/me  অথবা /api/users/me
    // যদি তোমার backend এ এটা না থাকে, তাহলে এই try ব্লক fail হবে—কিন্তু login state নষ্ট করবে না।
    try {
      const me = await api.getAuth("/api/auth/me", t);
      if (me?.ok) {
        setUser(me.user || me.data?.user || null);
        safeSetUser(me.user || me.data?.user || null);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const t = safeGetLS(TOKEN_KEY);

        if (!t) {
          if (!alive) return;
          setUser(null);
          setToken("");
          safeRemoveLS(USER_KEY);
          return;
        }

        if (!alive) return;

        // ✅ token + user state restore (refresh এ logout হবে না)
        setToken(t);
        const u = safeGetUser();
        if (u) setUser(u);

        // ✅ background sync (endpoint থাকলে)
        await refreshMe();
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.post("/api/auth/login", { phone, password });

    if (res?.ok && res?.token) {
      const t = String(res.token);

      safeSetLS(TOKEN_KEY, t);
      setToken(t);

      const u = res.user || res.data?.user || null;
      setUser(u);
      safeSetUser(u);

      return { ok: true };
    }

    return { ok: false, message: res?.message || "Login failed" };
  };

  const register = async (payload: { name: string; phone: string; password: string; gender?: string }) => {
    const res = await api.post("/api/auth/register", payload);

    // register এর পরে token দিলে persist করবো
    if (res?.ok && res?.token) {
      const t = String(res.token);

      safeSetLS(TOKEN_KEY, t);
      setToken(t);

      const u = res.user || res.data?.user || null;
      setUser(u);
      safeSetUser(u);
    }

    return { ok: !!res?.ok, message: res?.message || (res?.ok ? "Registered" : "Register failed") };
  };

  const logout = () => {
    safeRemoveLS(TOKEN_KEY);
    safeRemoveLS(USER_KEY);
    setToken("");
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, refreshMe }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  // Provider missing হলে crash না করে fallback দিবে (কিন্তু app broken হবে না)
  if (!ctx) {
    return {
      user: null,
      token: "",
      loading: false,
      login: async () => ({ ok: false, message: "AuthProvider missing" }),
      register: async () => ({ ok: false, message: "AuthProvider missing" }),
      logout: () => {},
      refreshMe: async () => {},
    };
  }

  return ctx;
}