"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  title?: string;
  price?: number;
  qty: number;
  variant?: string;
};

type CartCtx = {
  items: CartItem[];
  buyNowItem: CartItem | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  setBuyNow: (item: CartItem) => void;
  clearBuyNow: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

const CART_KEY = "cart_items_v1";
const BUY_KEY = "buy_now_item_v1";

function safeJsonParse<T>(text: string | null, fallback: T): T {
  try {
    return text ? (JSON.parse(text) as T) : fallback;
  } catch {
    return fallback;
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return safeJsonParse<T>(localStorage.getItem(key), fallback);
}

function saveToStorage<T>(key: string, val: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(val));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  useEffect(() => {
    setItems(loadFromStorage<CartItem[]>(CART_KEY, []));
    setBuyNowItem(loadFromStorage<CartItem | null>(BUY_KEY, null));
  }, []);

  useEffect(() => saveToStorage(CART_KEY, items), [items]);
  useEffect(() => saveToStorage(BUY_KEY, buyNowItem), [buyNowItem]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === item.id && x.variant === item.variant);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + (item.qty || 1) };
        return copy;
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  };

  const removeFromCart = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));

  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));

  const clearCart = () => setItems([]);

  const setBuyNow = (item: CartItem) => setBuyNowItem({ ...item, qty: item.qty || 1 });
  const clearBuyNow = () => setBuyNowItem(null);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      buyNowItem,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      setBuyNow,
      clearBuyNow,
    }),
    [items, buyNowItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}