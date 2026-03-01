"use client";

import { useEffect, useState } from "react";
import { api } from "../../api/api";
import AdminRoute from "../../components/AdminRoute";
import Link from "@/components/Link";

const STATUSES = ["PLACED", "CONFIRMED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

function Inner() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);

      // ✅ Admin token ALWAYS here (fresh read from localStorage)
      const t = api.adminToken ? api.adminToken() : "";

      if (!t) {
        setOrders([]);
        return;
      }

      const rr = await api.getAuth("/api/admin/orders", t);

      if (!rr?.ok) {
        alert(rr?.message || "Failed to load orders");
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(rr.orders) ? rr.orders : []);
    } catch (e: any) {
      alert(e?.message || "Orders load failed");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const setStatus = async (id: string, status: string) => {
    const t = api.adminToken ? api.adminToken() : "";
    if (!t) return alert("No admin token");

    // ✅ must be putAuth (Authorization header)
    const rr = await api.putAuth(`/api/admin/orders/${id}/status`, t, { status });

    if (!rr?.ok) return alert(rr?.message || "Failed to update status");
    load();
  };

  const statusLabel = (s: any) => {
    const v = String(s || "PLACED");
    return v.replaceAll("_", " ");
  };

  return (
    <div className="container adminOrdersWrap">
      <div className="rowBetween adminOrdersHeader">
        <h2>Admin Orders</h2>
        <Link className="btnGhost" to="/admin">
          ← Back
        </Link>
      </div>

      {loading ? (
        <div className="box adminOrderCard">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="box adminOrderCard">No orders found</div>
      ) : (
        orders.map((o: any) => {
          const shipping = o.shipping || {};
          const items = Array.isArray(o.items) ? o.items : [];

          return (
            <div className="box adminOrderCard" key={o._id || o.orderNo}>
              {/* top */}
              <div className="adminOrderTop">
                <div className="adminOrderTopLeft">
                  <div className="adminOrderNoRow">
                    <div className="adminOrderNo">Order {o.orderNo || o._id}</div>

                    <span className={`adminStatusBadge st-${String(o.status || "PLACED")}`}>
                      {statusLabel(o.status)}
                    </span>
                  </div>

                  {/* ✅ FULL SHIPPING DETAILS */}
                  <div className="adminOrderMeta">
                    <div className="shipName">{shipping.fullName || "No name"}</div>

                    <div className="shipPhones">
                      {shipping.phone1 || "No phone"}
                      {shipping.phone2 ? `, ${shipping.phone2}` : ""}
                    </div>

                    <div className="shipAddress">{shipping.addressLine || "No address"}</div>

                    <div className="shipArea">
                      {shipping.upazila ? `${shipping.upazila}, ` : ""}
                      {shipping.district || "—"}, {shipping.division || "—"}
                    </div>

                    {shipping.note ? <div className="shipNote">Note: {shipping.note}</div> : null}
                  </div>
                </div>

                <div className="adminOrderTopRight">
                  <div className="adminOrderTime">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                  </div>
                </div>
              </div>

              {/* items */}
              <div className="adminItems">
                {items.length === 0 ? (
                  <div className="muted" style={{ marginTop: 10 }}>
                    No items
                  </div>
                ) : (
                  items.map((it: any, i: number) => {
                    const qty = Number(it?.qty || 0);
                    const price = Number(it?.price || 0);
                    const lineTotal = price * qty;

                    return (
                      <div className="adminItem" key={i}>
                        <div className="adminItemInfo">
                          <div className="adminItemTitle">{it?.title || "No title"}</div>
                          {it?.variant ? <div className="adminItemVar">{it.variant}</div> : null}
                        </div>

                        <div className="adminItemRight">
                          <div className="adminQty">x{qty}</div>
                          <div className="adminPrice">৳ {lineTotal}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* bottom */}
              <div className="adminBottom">
                <div className="adminTotal">Total: ৳ {o.total ?? "—"}</div>

                <div className="adminBottomRight">
                  <select
                    className="adminStatusSelect"
                    value={o.status || "PLACED"}
                    onChange={(e) => setStatus(o._id, (e.target as HTMLSelectElement).value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function AdminOrders() {
  return (
    <AdminRoute>
      <Inner />
    </AdminRoute>
  );
}