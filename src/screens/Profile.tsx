"use client";

// src/pages/Profile.jsx

import { useEffect, useMemo, useState } from "react";
import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import useNoIndex from "../utils/useNoIndex";

const TABS = [
  { key: "PLACED", label: "Placed" },
  { key: "CONFIRMED", label: "To Ship" },
  { key: "DELIVERED", label: "To Received" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "ALL", label: "All Orders" }
];

function formatBDT(n) {
  return `৳ ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
}

function statusClass(s) {
  const k = String(s || "").toUpperCase();
  if (k === "DELIVERED") return "statusPill delivered";
  if (k === "CONFIRMED") return "statusPill confirmed";
  if (k === "CANCELLED") return "statusPill cancelled";
  if (k === "PLACED") return "statusPill placed";
  return "statusPill";
}

export default function Profile() {
  useNoIndex("noindex, nofollow");
  const { user, logout } = useAuth();
  const nav = useNavigate();

  // ✅ token stable রাখলাম (render এ বারবার বদলাবে না)
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [tab, setTab] = useState("PLACED");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        const url =
          tab === "ALL"
            ? "/api/orders/my"
            : `/api/orders/my?status=${encodeURIComponent(tab)}`;

        const r = await api.getAuth(url, token);

        if (!alive) return;

        if (r?.ok) setOrders(Array.isArray(r.orders) ? r.orders : []);
        else setOrders([]);
      } catch {
        if (alive) setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [tab, token]);

  const doLogout = () => {
    const ok = window.confirm("Are you sure you want to logout?");
    if (!ok) return;
    logout();
    nav("/login");
  };

  return (
    <div className="container profilePage">
      {/* ✅ Profile Header */}
      <div className="profileTop premiumCard profileTopPremium">
        <div className="profileWho">
          <div className="profileName">{user?.fullName || ""}</div>
          <div className="profilePhone">{user?.phone || ""}</div>
        </div>

        <div className="profileActions profileActionsPremium">
          <Link className="btnGhost profileBtn" to="/settings">
            ⚙ Settings
          </Link>

          <button className="btnGhost profileBtn" type="button" onClick={doLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profileTitleRowPremium">
        <div>
          <h3 className="profileH">My Orders</h3>
          <div className="muted">Filter by status</div>
        </div>
      </div>

      {/* ✅ Tabs (Premium + scroll) */}
      <div className="tabsRowPremium" role="tablist" aria-label="Order status filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? "chipPremium active" : "chipPremium"}
            onClick={() => setTab(t.key)}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ✅ Orders */}
      {loading ? (
        <div className="box premiumCard profileEmptyCard">
          <div className="emptyIcon">⏳</div>
          <div className="emptyTitle">Loading orders...</div>
          <div className="emptyHint">Please wait a moment.</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="box premiumCard profileEmptyCard">
          <div className="emptyIcon">🧾</div>
          <div className="emptyTitle">No orders found</div>
          <div className="emptyHint">Try another status or start shopping.</div>
          <Link className="btnPrimary emptyBtn" to="/shop">
            Shop Now
          </Link>
        </div>
      ) : (
        orders.map((o) => {
          const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : "—";
          const orderId = o.orderNo || o._id;

          return (
            <div key={o._id} className="box premiumCard orderCardPremium">
              <div className="orderTopRowPremium">
                <div className="orderId">
                  Order ID: <b>{orderId}</b>
                </div>
                <div className="orderDate muted">{created}</div>
              </div>

              <div className="orderStatusRowPremium">
                <span className="muted">Status</span>
                <span className={statusClass(o.status)}>{String(o.status || "—")}</span>
              </div>

              <div className="orderItemsPremium">
                {(o.items || []).map((it, i) => {
                  const img =
                    it?.image ||
                    it?.images?.[0] ||
                    it?.thumb ||
                    "https://via.placeholder.com/120x90?text=Product";

                  const title = it?.title || "No title";
                  const variant = it?.variant || "";
                  const qty = Number(it?.qty || 0);
                  const price = Number(it?.price || 0);
                  const lineTotal = price * qty;

                  return (
                    <div key={i} className="orderItemRowPremium">
                      <div className="orderItemThumb">
                        <img
                          src={img}
                          alt={title}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/120x90?text=Product";
                          }}
                        />
                      </div>

                      <div className="orderItemInfo">
                        <div className="orderItemTitle">{title}</div>
                        {variant ? <div className="orderItemVariant muted">{variant}</div> : null}
                        <div className="orderItemMeta">
                          <span className="muted">
                            x{qty} — {formatBDT(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="orderTotalRowPremium">
                <b>Total</b>
                <b>{formatBDT(o.total ?? 0)}</b>
              </div>
            </div>
          );
        })
      )}

      <div className="center profileBottomCta">
        <Link className="btnPrimary" to="/">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
