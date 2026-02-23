"use client";

import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { AuthProvider } from "@/context/AuthContext";

export default function Providers({ children }) {
  return (
    <HelmetProvider>
      <CartProvider>
        <FavoritesProvider>
          <AuthProvider>{children}</AuthProvider>
        </FavoritesProvider>
      </CartProvider>
    </HelmetProvider>
  );
}
