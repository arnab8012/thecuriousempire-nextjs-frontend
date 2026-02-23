"use client";

// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const CART_KEY = "cart_items_v1";
const BUY_KEY = "buy_now_item_v1";

function loadCart() {
  try {
    const j = JSON.parse(localStorage.getItem("cart_items_v1") || "[]");
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  // 🛒 normal cart
  const [items, setItems] = useState(loadCart);

  // ⚡ buy-now single item (NOT part of cart)
  const [checkoutItem, setCheckoutItem] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BUY_KEY) || "null");
    } catch {
      return null;
    }
  });

  // ---------- CART ----------
  const add = (item) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (x) =>
          x.productId === item.productId &&
          String(x.variant || "") === String(item.variant || "")
      );

      let next;
      if (i >= 0) {
        next = prev.map((x, idx) =>
          idx === i ? { ...x, qty: Number(x.qty || 0) + Number(item.qty || 0) } : x
        );
      } else {
        next = [...prev, { ...item, qty: Number(item.qty || 1) }];
      }

      saveCart(next);
      return next;
    });
  };

  // ✅ INC qty
  const inc = (productId, variant = "") => {
    setItems((prev) => {
      const next = prev.map((x) => {
        const same =
          String(x.productId) === String(productId) &&
          String(x.variant || "") === String(variant || "");
        if (!same) return x;
        return { ...x, qty: Number(x.qty || 0) + 1 };
      });

      saveCart(next);
      return next;
    });
  };

  // ✅ DEC qty (qty 1 এর নিচে যাবে না)
  const dec = (productId, variant = "") => {
    setItems((prev) => {
      const next = prev.map((x) => {
        const same =
          String(x.productId) === String(productId) &&
          String(x.variant || "") === String(variant || "");
        if (!same) return x;
        return { ...x, qty: Math.max(1, Number(x.qty || 0) - 1) };
      });

      saveCart(next);
      return next;
    });
  };

  const remove = (productId, variant = "") => {
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
    localStorage.removeItem(CART_KEY);
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
      qty
    };

    setCheckoutItem(one);
    localStorage.setItem(BUY_KEY, JSON.stringify(one));
  };

  const clearBuyNow = () => {
    setCheckoutItem(null);
    localStorage.removeItem(BUY_KEY);
  };

  // ---------- helpers ----------
  const cartCount = useMemo(
    () => items.reduce((s, x) => s + (x.qty || 0), 0),
    [items]
  );

  const value = {
    // cart
    items,
    add,
    inc, // ✅ added
    dec, // ✅ added
    remove,
    clear,
    cartCount,

    // buy now
    buyNow,
    checkoutItem,
    clearBuyNow
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return (
    useContext(CartContext) ||
    ({
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
      useUserCart: () => {},
    } as any)
  );
}