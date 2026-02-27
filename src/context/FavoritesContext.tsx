"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type FavoritesContextValue = {
  favIds: string[];
  useUserFav: (uidOrPhone?: string | null) => void;

  isFav: (id: any) => boolean;
  toggle: (id: any) => void;
  remove: (id: any) => void;
  clear: () => void;
};

const FavoritesCtx = createContext<FavoritesContextValue | null>(null);

const LS_GUEST = "fav_guest";
const userFavKey = (uid: any) => `fav_user_${String(uid || "").trim()}`;

function safeParse<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw);
    return (v ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function loadKey<T>(key: string, fallback: T): T {
  // ✅ localStorage শুধু browser এ থাকে
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? safeParse<T>(raw, fallback) : fallback;
  } catch {
    return fallback;
  }
}

function saveKey(key: string, value: any) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [activeKey, setActiveKey] = useState<string>(LS_GUEST);

  const [favIds, setFavIds] = useState<string[]>(() => {
    const d = loadKey<any>(LS_GUEST, []);
    return Array.isArray(d) ? d.map(String) : [];
  });

  // ✅ Persist to localStorage
  useEffect(() => {
    saveKey(activeKey, favIds);
  }, [favIds, activeKey]);

  const useUserFav = (uidOrPhone?: string | null) => {
    const uid = String(uidOrPhone || "").trim();

    if (!uid) {
      setActiveKey(LS_GUEST);
      const gf = loadKey<any>(LS_GUEST, []);
      setFavIds(Array.isArray(gf) ? gf.map(String) : []);
      return;
    }

    const k = userFavKey(uid);
    setActiveKey(k);
    const uf = loadKey<any>(k, []);
    setFavIds(Array.isArray(uf) ? uf.map(String) : []);
  };

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favIds,
      useUserFav,

      isFav(id: any) {
        const s = String(id);
        return favIds.includes(s);
      },

      toggle(id: any) {
        const s = String(id);
        setFavIds((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
      },

      remove(id: any) {
        const s = String(id);
        setFavIds((prev) => prev.filter((x) => x !== s));
      },

      clear() {
        setFavIds([]);
      },
    }),
    [favIds]
  );

  return <FavoritesCtx.Provider value={value}>{children}</FavoritesCtx.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesCtx);

  // ✅ Provider missing হলেও crash করবে না
  if (!ctx) {
    return {
      favIds: [],
      useUserFav: () => {},
      isFav: () => false,
      toggle: () => {},
      remove: () => {},
      clear: () => {},
    };
  }

  return ctx;
}