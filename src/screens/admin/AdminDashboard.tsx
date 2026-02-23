"use client";

import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";

export default function AdminDashboard() {
  const nav = useNavigate();

  return (
    <div className="container">
      <div className="adminTopRow">
        <h2 className="adminTitle" style={{ margin: 0 }}>
          Admin Dashboard
        </h2>

        <button
          className="adminLogout"
          type="button"
          onClick={() => {
            localStorage.removeItem("admin_token");
            nav("/admin/login");
          }}
        >
          Logout
        </button>
      </div>

      {/* ✅ Premium quick actions (same links, nothing removed) */}
      <div className="adminDashGrid">
        <Link className="adminDashCard" to="/admin/products">
          <div className="adminDashIconWrap">
            <div className="adminDashIcon">🛍️</div>
          </div>
          <div className="adminDashText">
            <div className="adminDashTitle">Products</div>
            <div className="adminDashSub">Add / Edit / Delete products</div>
          </div>
        </Link>

        <Link className="adminDashCard" to="/admin/categories">
          <div className="adminDashIconWrap">
            <div className="adminDashIcon">🗂️</div>
          </div>
          <div className="adminDashText">
            <div className="adminDashTitle">Categories</div>
            <div className="adminDashSub">Manage category list</div>
          </div>
        </Link>

        <Link className="adminDashCard" to="/admin/orders">
          <div className="adminDashIconWrap">
            <div className="adminDashIcon">📦</div>
          </div>
          <div className="adminDashText">
            <div className="adminDashTitle">Orders</div>
            <div className="adminDashSub">View & update orders</div>
          </div>
        </Link>

        <Link className="adminDashCard" to="/admin/banners">
          <div className="adminDashIconWrap">
            <div className="adminDashIcon">🖼️</div>
          </div>
          <div className="adminDashText">
            <div className="adminDashTitle">Banners</div>
            <div className="adminDashSub">Upload & manage banners</div>
          </div>
        </Link>
      </div>

      {/* ✅ Keep your existing chips row too (same links) */}
      <div className="adminChips">
        <Link className="adminChip" to="/admin/products">
          Products
        </Link>
        <Link className="adminChip" to="/admin/categories">
          Categories
        </Link>
        <Link className="adminChip" to="/admin/orders">
          Orders
        </Link>
        <Link className="adminChip" to="/admin/banners">
          Banners
        </Link>
      </div>
    </div>
  );
}
