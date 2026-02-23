"use client";

import NavLink from "@/components/NavLink";
import { useLocation } from "@/utils/useLocation";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { items } = useCart();
  const { favIds } = useFavorites();
  const { user } = useAuth();
  const loc = useLocation();

  if (loc.pathname.startsWith("/admin")) return null;

  const cartCount = (items || []).reduce((s, x) => s + (Number(x?.qty) || 0), 0);
  const favCount = Array.isArray(favIds) ? favIds.length : 0;

  const cls = ({ isActive }) => (isActive ? "bnItem active" : "bnItem");

  return (
    <nav className="bottomNav">
      <NavLink to="/" end className={cls}>
        <span className="bnIcon">🏠</span>
        <span className="bnTxt">Home</span>
      </NavLink>

      <NavLink to="/shop" className={cls}>
        <span className="bnIcon">🛍️</span>
        <span className="bnTxt">Shop</span>
      </NavLink>

      <NavLink to="/cart" className={cls}>
        <span className="bnIcon">
          🛒{cartCount > 0 ? <i className="bnBadge">{cartCount}</i> : null}
        </span>
        <span className="bnTxt">Cart</span>
      </NavLink>

      <NavLink to="/favorites" className={cls}>
        <span className="bnIcon">
          ❤️{favCount > 0 ? <i className="bnBadge">{favCount}</i> : null}
        </span>
        <span className="bnTxt">Priyo</span>
      </NavLink>

      <NavLink to={user ? "/profile" : "/login"} className={cls}>
        <span className="bnIcon">👤</span>
        <span className="bnTxt">{user ? "Profile" : "Login"}</span>
      </NavLink>
    </nav>
  );
}
