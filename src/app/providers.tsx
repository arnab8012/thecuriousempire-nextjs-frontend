"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}