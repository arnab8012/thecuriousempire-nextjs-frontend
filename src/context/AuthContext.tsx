"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { useCart } from "./CartContext";
import { useFavorites } from "./FavoritesContext";

type UserType = any;

type AuthContextValue = {
  user: UserType | null;
  booting: boolean;
  login: (phone: string, password: string) => Promise<any>;
  register: (payload: { fullName: string; phone: string; password: string; gender?: string }) => Promise<any>;
  logout: () => void;
  refreshMe: () => Promise<any>;
  updateMe: (payload: any) => Promise<any>;
  resetPassword: (phone: string, fullName: string, newPassword: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type CartContextType = { useUserCart?: (uid: string) => void };
type FavoritesContextType = { useUserFav?: (uid: string) => void };

function getUid(u: any) {
  return u?._id || u?.id || u?.phone || u?.email || "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const cart = (useCart() as unknown as CartContextType) || null;
  const fav = (useFavorites() as unknown as FavoritesContextType) || null;

  const [user, setUser] = useState<UserType | null>(null);
  const [booting, setBooting] = useState(true);

  const safeLocalStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

  // ===== BOOT: token থাকলে /me =====
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const ls = safeLocalStorage();
        const t = ls?.getItem("token") || "";

        if (!t) {
          if (alive) {
            setUser(null);
            setBooting(false);
            cart?.useUserCart?.("");
            fav?.useUserFav?.("");
          }
          return;
        }

        const r = await api.getAuth("/api/auth/me", t);
        if (!alive) return;

        if (r?.ok) {
          const u = r?.user || null;
          setUser(u);

          const uid = getUid(u);
          cart?.useUserCart?.(uid);
          fav?.useUserFav?.(uid);
        } else {
          ls?.removeItem("token");
          setUser(null);
          cart?.useUserCart?.("");
          fav?.useUserFav?.("");
        }
      } catch {
        if (alive) {
          const ls = safeLocalStorage();
          ls?.removeItem("token");
          setUser(null);
          cart?.useUserCart?.("");
          fav?.useUserFav?.("");
        }
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== LOGIN =====
  const login = async (phone: string, password: string) => {
    const r = await api.post("/api/auth/login", { phone, password });
    if (!r?.ok) return r;

    const ls = safeLocalStorage();
    if (r?.token) ls?.setItem("token", r.token); // ✅ safe
    else ls?.removeItem("token");

    const token = r?.token || (ls?.getItem("token") || "");

    // ✅ DB থেকে fresh user
    const me = token ? await api.getAuth("/api/auth/me", token) : null;
    const u = me?.ok ? me.user : r.user || null;

    setUser(u);

    const uid = getUid(u) || phone;
    cart?.useUserCart?.(uid);
    fav?.useUserFav?.(uid);

    setBooting(false);
    return { ok: true, user: u };
  };

  // ===== REGISTER =====
  const register = async (payload: { fullName: string; phone: string; password: string; gender?: string }) => {
    const { fullName, phone, password, gender } = payload;
    const r = await api.post("/api/auth/register", { fullName, phone, password, gender });
    if (!r?.ok) return r;

    const ls = safeLocalStorage();
    if (r?.token) ls?.setItem("token", r.token); // ✅ safe

    const u = r.user || null;
    setUser(u);

    const uid = getUid(u) || phone;
    cart?.useUserCart?.(uid);
    fav?.useUserFav?.(uid);

    setBooting(false);
    return { ok: true, user: u };
  };

  const refreshMe = async () => {
    const ls = safeLocalStorage();
    const t = ls?.getItem("token") || "";
    if (!t) return { ok: false, message: "No token" };

    const r = await api.getAuth("/api/auth/me", t);
    if (!r?.ok) return r;

    const u = r.user || null;
    setUser(u);

    const uid = getUid(u);
    cart?.useUserCart?.(uid);
    fav?.useUserFav?.(uid);

    return { ok: true, user: u };
  };

  const updateMe = async (payload: any) => {
    const ls = safeLocalStorage();
    const t = ls?.getItem("token") || "";
    if (!t) return { ok: false, message: "No token" };

    const r = await api.putAuth("/api/auth/me", t, payload);
    if (!r?.ok) return r;

    const u = r.user || null;
    setUser(u);

    const uid = getUid(u);
    cart?.useUserCart?.(uid);
    fav?.useUserFav?.(uid);

    return { ok: true, user: u };
  };

  const resetPassword = async (phone: string, fullName: string, newPassword: string) => {
    return api.post("/api/auth/reset-password", { phone, fullName, newPassword });
  };

  const logout = () => {
    const ls = safeLocalStorage();
    ls?.removeItem("token");
    setUser(null);
    setBooting(false);

    cart?.useUserCart?.("");
    fav?.useUserFav?.("");
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      booting,
      login,
      register,
      logout,
      refreshMe,
      updateMe,
      resetPassword,
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext) || ({} as AuthContextValue);
}