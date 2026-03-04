"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/api/api";

function prettyOrderStatus(s: string) {
  const st = String(s || "").toUpperCase();

  if (st === "CANCELLED") return "❌ Order Cancelled";
  if (st === "DELIVERED") return "✅ Order Delivered";
  if (st === "PLACED") return "⏳ Waiting for Confirmation";
  if (st === "CONFIRMED" || st === "IN_TRANSIT") return "🚚 Processing for Delivery";

  return st;
}

function statusTheme(s: string) {
  const st = String(s || "").toUpperCase();

  if (st === "CANCELLED")
    return { bg: "#fff1f1", border: "#ffd6d6", text: "#c62828", badge: "#ffebee" };

  if (st === "DELIVERED")
    return { bg: "#f1fff3", border: "#c8f5d0", text: "#2e7d32", badge: "#e8f5e9" };

  // PLACED / CONFIRMED / IN_TRANSIT / others
  return { bg: "#fff8e1", border: "#ffe0b2", text: "#ef6c00", badge: "#fff3e0" };
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");
  const token = api.token();

  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const theme = useMemo(() => statusTheme(order?.status), [order?.status]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const r = await (api as any).getAuth?.(`/api/orders/${id}`, token);

        let data = r;
        if (!data) {
          const resp = await fetch(`/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          data = await resp.json();
        }

        if (!data?.ok) {
          setErr(data?.message || "Order fetch failed");
          setOrder(null);
          return;
        }

        setOrder(data.order);
      } catch (e: any) {
        setErr(e?.message || "Something went wrong");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, router]);

  if (loading) return <div className="container">Loading...</div>;
  if (err) return <div className="container">{err}</div>;
  if (!order) return <div className="container">Order not found</div>;

  const ship = order.shipping || {};
  const paidBy = order.paymentMethod === "FULL_PAYMENT" ? "Full Payment" : "Cash on Delivery";

  // ✅ ছোট subtitle (Daraz style-ish)
  const subtitle =
    String(order.status || "").toUpperCase() === "DELIVERED"
      ? "Your package has been delivered."
      : String(order.status || "").toUpperCase() === "CANCELLED"
      ? "This order was cancelled."
      : String(order.status || "").toUpperCase() === "PLACED"
      ? "We will confirm your order soon."
      : "Your order is being processed for delivery.";

  return (
    <div className="container">
      <div className="rowBetween" style={{ marginBottom: 10 }}>
        <button className="btnGhost" type="button" onClick={() => router.back()}>
          ← Back
        </button>
        <h2 style={{ margin: 0 }}>Order Details</h2>
        <div />
      </div>

      {/* ✅ Status box (beautiful) */}
      <div
        className="box"
        style={{
          marginBottom: 12,
          background: theme.bg,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="rowBetween" style={{ alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, color: theme.text }}>{prettyOrderStatus(order.status)}</h3>
            <div className="muted" style={{ marginTop: 6 }}>
              {subtitle}
            </div>
          </div>

          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: theme.badge,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              fontWeight: 700,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            {String(order.status || "").toUpperCase()}
          </div>
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          Placed on: {new Date(order.createdAt).toLocaleString()}
        </div>
      </div>

      {/* ✅ Shipping */}
      <div className="box" style={{ marginBottom: 12 }}>
        <b>Shipping</b>
        <div style={{ marginTop: 8 }}>
          <div>{ship.fullName}</div>
          <div>Phone: {ship.phone1}</div>
          {ship.phone2 ? <div>Phone 2: {ship.phone2}</div> : null}
          <div style={{ marginTop: 6 }}>
            {ship.addressLine}, {ship.upazila}, {ship.district}, {ship.division}
          </div>
          {ship.note ? <div style={{ marginTop: 6 }}>Note: {ship.note}</div> : null}
        </div>
      </div>

      {/* ✅ Items */}
      <div className="box" style={{ marginBottom: 12 }}>
        <b>Items</b>
        <div style={{ marginTop: 10 }}>
          {(order.items || []).map((it: any, idx: number) => (
            <div
              key={idx}
              className="rowBetween"
              style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {it.image ? (
                  <img
                    src={it.image}
                    alt={it.title}
                    style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : null}

                <div>
                  <div style={{ fontWeight: 700 }}>{it.title}</div>
                  {it.variant ? <div className="muted">{it.variant}</div> : null}
                  <div className="muted">
                    ৳ {it.price} × {it.qty}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right", fontWeight: 700 }}>
                ৳ {Number(it.price) * Number(it.qty)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Summary */}
      <div className="box">
        <b>Order Summary</b>

        <div className="rowBetween" style={{ marginTop: 10 }}>
          <span>Subtotal</span>
          <b>৳ {order.subTotal}</b>
        </div>

        <div className="rowBetween">
          <span>Delivery Charge</span>
          <b>৳ {order.deliveryCharge}</b>
        </div>

        <div className="rowBetween" style={{ marginTop: 6 }}>
          <span>Total</span>
          <b>৳ {order.total}</b>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Paid by:</b> {paidBy}
        </div>

        <div style={{ marginTop: 6 }}>
          <b>Order ID:</b> {order._id}
        </div>

        <div style={{ marginTop: 6 }}>
          <b>Order No:</b> {order.orderNo}
        </div>
      </div>
    </div>
  );
}