"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartItem = {
  productId: string;
  title: string;
  price: number;
  image: string;
  variant?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  inc: (productId: string, variant?: string) => void;
  dec: (productId: string, variant?: string) => void;
  remove: (productId: string, variant?: string) => void;
  clear: () => void;
  cartCount: number;

  buyNow: (product: any, variant?: string, qty?: number) => void;
  checkoutItem: CartItem | null;
  clearBuyNow: () => void;

  // Optional (AuthContext call করছে)
  useUserCart?: (uid: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = "cart_items_v1";
const BUY_KEY = "buy_now_item_v1";

function safeParse(raw: string, fallback: any) {
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function loadKey<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (safeParse(raw, fallback) as T) : fallback;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const d = loadKey<any>(CART_KEY, []);
    return Array.isArray(d) ? d : [];
  });

  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(() => {
    const d = loadKey<any>(BUY_KEY, null);
    return d && typeof d === "object" ? d : null;
  });

  // persist cart
  useEffect(() => {
    saveKey(CART_KEY, items);
  }, [items]);

  // persist buy item
  useEffect(() => {
    saveKey(BUY_KEY, checkoutItem);
  }, [checkoutItem]);

  const add = (item: CartItem) => {
    const pid = String(item.productId || "");
    const vname = String(item.variant || "");
    if (!pid) return;

    setItems((prev) => {
      const i = prev.findIndex((x) => String(x.productId) === pid && String(x.variant || "") === vname);
      if (i >= 0) {
        const next = prev.map((x, idx) =>
          idx === i ? { ...x, qty: Number(x.qty || 0) + Number(item.qty || 1) } : x
        );
        return next;
      }
      return [...prev, { ...item, productId: pid, variant: vname, qty: Number(item.qty || 1) }];
    });
  };

  const inc = (productId: string, variant = "") => {
    const pid = String(productId || "");
    const vname = String(variant || "");
    if (!pid) return;

    setItems((prev) =>
      prev.map((x) =>
        String(x.productId) === pid && String(x.variant || "") === vname ? { ...x, qty: Number(x.qty || 0) + 1 } : x
      )
    );
  };

  const dec = (productId: string, variant = "") => {
    const pid = String(productId || "");
    const vname = String(variant || "");
    if (!pid) return;

    setItems((prev) =>
      prev.map((x) =>
        String(x.productId) === pid && String(x.variant || "") === vname
          ? { ...x, qty: Math.max(1, Number(x.qty || 0) - 1) }
          : x
      )
    );
  };

  const remove = (productId: string, variant = "") => {
    const pid = String(productId || "");
    const vname = String(variant || "");
    if (!pid) return;

    setItems((prev) => prev.filter((x) => !(String(x.productId) === pid && String(x.variant || "") === vname)));
  };

  const clear = () => {
    setItems([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(CART_KEY);
      } catch {}
    }
  };

  const buyNow = (product: any, variant = "", qty = 1) => {
    const pid = String(product?._id ?? product?.id ?? product?.productId ?? "");
    if (!pid) return;

    const one: CartItem = {
      productId: pid,
      title: String(product?.title ?? ""),
      price: Number(product?.price ?? 0),
      image: String(product?.images?.[0] ?? product?.image ?? "https://via.placeholder.com/300"),
      variant: String(variant || ""),
      qty: Math.max(1, Number(qty || 1)),
    };

    setCheckoutItem(one);
  };

  const clearBuyNow = () => {
    setCheckoutItem(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(BUY_KEY);
      } catch {}
    }
  };

  const cartCount = useMemo(() => items.reduce((s, x) => s + (Number(x.qty || 0) || 0), 0), [items]);

  // AuthContext call করে, but currently you store 1 cart for all users. Keep as no-op for compatibility.
  const useUserCart = (_uid: string) => {
    // If in future you want per-user cart, implement key switching here.
    return;
  };

  const value: CartContextValue = {
    items,
    add,
    inc,
    dec,
    remove,
    clear,
    cartCount,
    buyNow,
    checkoutItem,
    clearBuyNow,
    useUserCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext) || ({} as CartContextValue);
}