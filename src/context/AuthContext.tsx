"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string;
  isLoggedIn: boolean;

  setAuth: (token: string, user?: User | null) => void;
  logout: () => void;
};

// ✅ Provider না থাকলেও crash না করার জন্য undefined default
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user_v1";

function safeGet(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
function safeSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}
function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function readUserFromLS(): User | null {
  try {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    return j && typeof j === "object" ? j : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string>(() => safeGet(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => readUserFromLS());

  // ✅ token/user sync (client side)
  useEffect(() => {
    const t = safeGet(TOKEN_KEY);
    if (t && t !== token) setToken(t);

    const u = readUserFromLS();
    // shallow compare না করে simple set
    if (!user && u) setUser(u);
  }, []);

  const setAuth = (newToken: string, newUser?: User | null) => {
    const t = String(newToken || "");
    setToken(t);
    safeSet(TOKEN_KEY, t);

    if (newUser === undefined) return;

    if (!newUser) {
      setUser(null);
      safeRemove(USER_KEY);
      return;
    }

    setUser(newUser);
    safeSet(USER_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: Boolean(token),
      setAuth,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ✅ এইটাই তোমার missing export: useAuth
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx) return ctx;

  // fallback: Provider না থাকলেও crash হবে না
  return {
    user: null,
    token: "",
    isLoggedIn: false,
    setAuth: () => {},
    logout: () => {},
  };
}