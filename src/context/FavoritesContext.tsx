"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FavoritesCtx = createContext(null);

const LS_GUEST = "fav_guest";
const userFavKey = (uid) => `fav_user_${String(uid || "").trim()}`;

function safeParse(raw, fallback) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function loadKey(key: string, fallback: any) {
  if (typeof window === "undefined") return fallback; // ✅ SSR safe
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? safeParse(raw, fallback) : fallback;
  } catch {
    return fallback;
  }
}
export function FavoritesProvider({ children }) {
  const [activeKey, setActiveKey] = useState(LS_GUEST);

  const [favIds, setFavIds] = useState(() => {
    const d = loadKey(LS_GUEST, []);
    return Array.isArray(d) ? d : [];
  });

  useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(activeKey, JSON.stringify(favIds));
  } catch {}
}, [favIds, activeKey]);

  const useUserFav = (uidOrPhone) => {
    const uid = String(uidOrPhone || "").trim();

    if (!uid) {
      setActiveKey(LS_GUEST);
      const gf = loadKey(LS_GUEST, []);
      setFavIds(Array.isArray(gf) ? gf : []);
      return;
    }

    const k = userFavKey(uid);
    setActiveKey(k);
    const uf = loadKey(k, []);
    setFavIds(Array.isArray(uf) ? uf : []);
  };

  const value = useMemo(
    () => ({
      favIds,
      useUserFav,

      isFav(id) {
        return favIds.includes(String(id));
      },
      toggle(id) {
        const s = String(id);
        setFavIds((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
      },
      remove(id) {
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

export function useFavorites() {
  return (
    useContext(FavoritesCtx) ||
    ({
      favIds: [],
      toggle: () => {},
      remove: () => {},
      clear: () => {},
      useUserFav: () => {},
    } as any)
  );
}