"use client";

export default function MobileMenu({ open, onClose }) {
  return (
    <div className={`mobile-drawer ${open ? "open" : ""}`}>
      
      {/* Close button */}
      <button onClick={onClose}>✕</button>

      <ul>
        <li>Shop</li>
        <li>Offers</li>
        <li>Become a seller</li>
        <li>🌐 ভাষা</li>
      </ul>

      <div className="mobile-login-btn">
        👤 Log in
      </div>
    </div>
  );
}
