"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
// যদি Favourite context থাকে, এখানে add করবে:
// import { FavProvider } from "@/context/FavContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {/* <FavProvider> */}
        {children}
        {/* </FavProvider> */}
      </CartProvider>
    </AuthProvider>
  );
}