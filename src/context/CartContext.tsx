"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const CART_KEY = "cart_items_v1";
const BUY_KEY = "buy_now_item_v1";

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function loadFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  return safeJsonParse(raw, fallback);
}

function saveToStorage(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function CartProvider({ children }) {
  // ✅ start empty, then load after mount (avoids client crash)
  const [items, setItems] = useState([]);
  const [checkoutItem, setCheckoutItem] = useState(null);

  // ✅ load once on mount
  useEffect(() => {
    const loadedItems = loadFromStorage(CART_KEY, []);
    setItems(Array.isArray(loadedItems) ? loadedItems : []);

    const loadedBuy = loadFromStorage(BUY_KEY, null);
    setCheckoutItem(loadedBuy || null);
  }, []);

  // ✅ persist cart
  useEffect(() => {
    saveToStorage(CART_KEY, items);
  }, [items]);

  // ---------- CART ----------
  const add = (item) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (x) =>
          x.productId === item.productId &&
          String(x.variant || "") === String(item.variant || "")
      );

      if (i >= 0) {
        return prev.map((x, idx) =>
          idx === i
            ? { ...x, qty: Number(x.qty || 0) + Number(item.qty || 0) }
            : x
        );
      }
      return [...prev, { ...item, qty: Number(item.qty || 1) }];
    });
  };

  const inc = (productId, variant = "") => {
    setItems((prev) =>
      prev.map((x) => {
        const same =
          String(x.productId) === String(productId) &&
          String(x.variant || "") === String(variant || "");
        return same ? { ...x, qty: Number(x.qty || 0) + 1 } : x;
      })
    );
  };

  const dec = (productId, variant = "") => {
    setItems((prev) =>
      prev.map((x) => {
        const same =
          String(x.productId) === String(productId) &&
          String(x.variant || "") === String(variant || "");
        return same ? { ...x, qty: Math.max(1, Number(x.qty || 0) - 1) } : x;
      })
    );
  };

  const remove = (productId, variant = "") => {
    setItems((prev) =>
      prev.filter(
        (x) =>
          !(
            String(x.productId) === String(productId) &&
            String(x.variant || "") === String(variant || "")
          )
      )
    );
  };

  const clear = () => {
    setItems([]);
    if (typeof window !== "undefined") window.localStorage.removeItem(CART_KEY);
  };

  // ---------- BUY NOW ----------
  const buyNow = (product, variant = "", qty = 1) => {
    const one = {
      productId: product._id,
      title: product.title,
      price: product.price,
      image:
        product.images?.[0] ||
        product.image ||
        "https://via.placeholder.com/300",
      variant,
      qty,
    };

    setCheckoutItem(one);
    saveToStorage(BUY_KEY, one);
  };

  const clearBuyNow = () => {
    setCheckoutItem(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(BUY_KEY);
  };

  const cartCount = useMemo(
    () => items.reduce((s, x) => s + (Number(x.qty) || 0), 0),
    [items]
  );

  const value = {
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

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx) return ctx;

  // fallback (never crash)
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