"use client";

// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/api";
import { useCart } from "./CartContext";
import { useFavorites } from "./FavoritesContext";

const AuthContext = createContext(null);

function getUid(u) {
  // ✅ যেটা তোমার user object এ আছে সেটা ধরবে
  return u?._id || u?.id || u?.phone || u?.email || "";
}

export function AuthProvider({ children }) {
  const cart = useCart();
  const fav = useFavorites();

  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // ===== BOOT: token থাকলে /me =====
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const t = localStorage.getItem("token");

        if (!t) {
          if (alive) {
            setUser(null);
            setBooting(false);

            // ✅ guest mode
            cart?.useUserCart?.("");
            fav?.useUserFav?.("");
          }
          return;
        }

        const r = await api.getAuth("/api/auth/me", t);
        if (!alive) return;

        if (r?.ok) {
          const u = r.user || null;
          setUser(u);

          const uid = getUid(u);
          cart?.useUserCart?.(uid);
          fav?.useUserFav?.(uid);
        } else {
          localStorage.removeItem("token");
          setUser(null);

          cart?.useUserCart?.("");
          fav?.useUserFav?.("");
        }
      } catch (e) {
        if (alive) {
          localStorage.removeItem("token");
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
const login = async (phone, password) => {
  const r = await api.post("/api/auth/login", { phone, password });
  if (!r?.ok) return r;

  // token save
  localStorage.setItem("token", r.token);

  // 🔥 IMPORTANT: DB থেকে fresh user নাও
  const me = await api.getAuth("/api/auth/me", r.token);
  const u = me?.ok ? me.user : r.user || null;

  setUser(u);

  const uid = getUid(u) || phone;
  cart?.useUserCart?.(uid);
  fav?.useUserFav?.(uid);

  setBooting(false);
  return { ok: true, user: u };
};

  // ===== REGISTER =====
  const register = async ({ fullName, phone, password, gender }) => {
    const r = await api.post("/api/auth/register", { fullName, phone, password, gender });
    if (!r?.ok) return r;

    if (r.token) localStorage.setItem("token", r.token);

    const u = r.user || null;
    setUser(u);

    const uid = getUid(u) || phone;
    cart?.useUserCart?.(uid);
    fav?.useUserFav?.(uid);

    setBooting(false);
    return { ok: true, user: u };
  };

  // ===== REFRESH ME (manual) =====
  const refreshMe = async () => {
    const t = localStorage.getItem("token");
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

  // ===== UPDATE ME (profile + shipping address) =====
  // payload উদাহরণ:
  // { fullName, gender, dateOfBirth, permanentAddress, shippingAddress: { ... } }
  const updateMe = async (payload) => {
    const t = localStorage.getItem("token");
    if (!t) return { ok: false, message: "No token" };

    // ✅ FIX: putAuth(path, token, body) — তোমারটা উল্টা ছিল
    const r = await api.putAuth("/api/auth/me", t, payload);
    if (!r?.ok) return r;

    const u = r.user || null;
    setUser(u);

    const uid = getUid(u);
    cart?.useUserCart?.(uid);
    fav?.useUserFav?.(uid);

    return { ok: true, user: u };
  };

  // ===== RESET PASSWORD (phone + fullName match) =====
  // Backend এ route লাগবে: POST /api/auth/reset-password
  // body: { phone, fullName, newPassword }
  const resetPassword = async (phone, fullName, newPassword) => {
    const r = await api.post("/api/auth/reset-password", { phone, fullName, newPassword });
    return r; // {ok:true} বা {ok:false,message}
  };

  // ===== LOGOUT =====
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setBooting(false);

    // ✅ guest mode -> badge 0
    cart?.useUserCart?.("");
    fav?.useUserFav?.("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        booting,
        login,
        register,
        logout,
        refreshMe,
        updateMe,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // ✅ Build/Prerender safety:
  // In rare cases (or mis-wiring) context can be null/undefined.
  // Returning a safe empty object prevents destructuring crashes.
  return (
    useContext(AuthContext) ||
    ({
      user: null,
      booting: false,
      login: async () => ({ ok: false, message: "AuthProvider missing" }),
      register: async () => ({ ok: false, message: "AuthProvider missing" }),
      logout: () => {},
      refreshMe: async () => ({ ok: false, message: "AuthProvider missing" }),
      updateMe: async () => ({ ok: false, message: "AuthProvider missing" }),
      resetPassword: async () => ({ ok: false, message: "AuthProvider missing" }),
    } as any)
  );
}