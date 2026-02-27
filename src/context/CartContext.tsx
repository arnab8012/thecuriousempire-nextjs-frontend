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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setItems(safeJsonParse<CartItem[]>(localStorage.getItem(CART_KEY), []));
    setBuyNowItem(safeJsonParse<CartItem | null>(localStorage.getItem(BUY_KEY), null));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(BUY_KEY, JSON.stringify(buyNowItem));
  }, [buyNowItem]);

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

  const removeFromCart = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  const setQty = (id: string, qty: number) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, qty: Math.max(1, qty) } : x)));

  const clearCart = () => setItems([]);

  const setBuyNow = (item: CartItem) => setBuyNowItem({ ...item, qty: item.qty || 1 });
  const clearBuyNow = () => setBuyNowItem(null);

  const value = useMemo<CartCtx>(
    () => ({ items, buyNowItem, addToCart, removeFromCart, setQty, clearCart, setBuyNow, clearBuyNow }),
    [items, buyNowItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}