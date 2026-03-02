"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type CartItem = {
  productId: string;
  title?: string;
  image?: string;
  variant?: string;
  qty?: number;
  price?: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  inc: (productId: any, variant?: string) => void;
  dec: (productId: any, variant?: string) => void;
  remove: (productId: any, variant?: string) => void;
  clear: () => void;
  cartCount: number;

  buyNow: (product: any, variant?: string, qty?: number) => void;
  checkoutItem: any;
  clearBuyNow: () => void;
};

// ✅ Context default undefined (safe)
const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_KEY = "cart_items_v1";
const BUY_KEY = "buy_now_item_v1";

function safeGet(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
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

function loadCart(): CartItem[] {
  try {
    const raw = safeGet(CART_KEY) || "[]";
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  safeSet(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  const [checkoutItem, setCheckoutItem] = useState<any>(() => {
    try {
      const raw = safeGet(BUY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const add = (item: CartItem) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (x) =>
          x.productId === item.productId &&
          String(x.variant || "") === String(item.variant || "")
      );

      let next: CartItem[];
      if (i >= 0) {
        next = prev.map((x, idx) =>
          idx === i
            ? { ...x, qty: Number(x.qty || 0) + Number(item.qty || 0) }
            : x
        );
      } else {
        next = [...prev, { ...item, qty: Number(item.qty || 1) }];
      }

      saveCart(next);
      return next;
    });
  };

  const inc = (productId: any, variant = "") => {
    setItems((prev) => {
      const next = prev.map((x) => {
        const same =
          String(x.productId) === String(productId) &&
          String(x.variant || "") === String(variant || "");
        return same ? { ...x, qty: Number(x.qty || 0) + 1 } : x;
      });
      saveCart(next);
      return next;
    });
  };

  const dec = (productId: any, variant = "") => {
    setItems((prev) => {
      const next = prev.map((x) => {
        const same =
          String(x.productId) === String(productId) &&
          String(x.variant || "") === String(variant || "");
        return same ? { ...x, qty: Math.max(1, Number(x.qty || 0) - 1) } : x;
      });
      saveCart(next);
      return next;
    });
  };

  const remove = (productId: any, variant = "") => {
    setItems((prev) => {
      const next = prev.filter(
        (x) =>
          !(
            String(x.productId) === String(productId) &&
            String(x.variant || "") === String(variant || "")
          )
      );
      saveCart(next);
      return next;
    });
  };

  const clear = () => {
    setItems([]);
    safeRemove(CART_KEY);
  };

  const buyNow = (product: any, variant = "", qty = 1) => {
    const one = {
      productId: String(product?._id || product?.id || ""),
      title: product?.title,
      price: product?.price,
      image: product?.images?.[0] || product?.image || "https://via.placeholder.com/300",
      variant,
      qty,
    };

    setCheckoutItem(one);
    safeSet(BUY_KEY, JSON.stringify(one));
  };

  const clearBuyNow = () => {
    setCheckoutItem(null);
    safeRemove(BUY_KEY);
  };

  const cartCount = useMemo(
    () => items.reduce((s, x) => s + Number(x.qty || 0), 0),
    [items]
  );

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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ✅ IMPORTANT FIX: Provider না থাকলেও crash করবে না
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);

  if (ctx) return ctx;

  // fallback (NO CRASH)
  return {
    items: [],
    add: () => {},
    inc: () => {},
    dec: () => {},
    remove: () => {},
    clear: () => {},
    cartCount: 0,
    buyNow: () => {},
    checkoutItem: null,
    clearBuyNow: () => {},
  };
}