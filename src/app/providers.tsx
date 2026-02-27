"use client";

import React from "react";
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

export default function Providers({ children }: { children: React.ReactNode }) {
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