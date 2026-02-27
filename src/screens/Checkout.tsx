"use client";

// ✅ Next.js (App Router) version of your old Vite Checkout.jsx
// ✅ Same localStorage book system + DB save (PUT /api/auth/me)
// ✅ Replace-ready: app/(whatever)/checkout/Checkout.tsx  or  src/screens/Checkout.tsx

import "../styles/checkout.css";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import useNoIndex from "../utils/useNoIndex";

const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
];

const BOOK_KEY = "shipping_book_v1";

type Shipping = {
  fullName: string;
  phone1: string;
  phone2: string;
  division: string;
  district: string;
  upazila: string;
  addressLine: string;
  note: string;
};

type BookItem = {
  id: string;
  label: string;
  shipping: Shipping;
};

type Book = {
  selectedId: string;
  items: BookItem[];
};

function emptyShipping(user: any): Shipping {
  return {
    fullName: user?.fullName || "",
    phone1: user?.phone || "",
    phone2: "",
    division: "Dhaka",
    district: "",
    upazila: "",
    addressLine: "",
    note: "",
  };
}

function makeLabel(s: Shipping) {
  const a = [s.fullName, s.phone1, s.division, s.district, s.upazila, s.addressLine]
    .filter(Boolean)
    .join(" | ");
  return a.length > 80 ? a.slice(0, 80) + "..." : a || "Address";
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadBook(): Book {
  if (typeof window === "undefined") return { selectedId: "", items: [] };

  try {
    const b = JSON.parse(localStorage.getItem(BOOK_KEY) || "{}");
    return {
      selectedId: b?.selectedId || "",
      items: Array.isArray(b?.items) ? b.items : [],
    };
  } catch {
    return { selectedId: "", items: [] };
  }
}

export default function Checkout() {
  useNoIndex?.("noindex, nofollow");

  const router = useRouter();
  const sp = useSearchParams();

  const buyMode = sp.get("mode") === "buy";

  const cart = useCart() as any;
  const { user } = useAuth() as any;

  const token = api.token();

  // ✅ ADD: DB-তে shippingAddress save করার helper (legacy single object)
  const saveShippingToDB = async (ship: Shipping) => {
    if (!token) return { ok: false, message: "No token" };
    // backend route: PUT /api/auth/me  body: { shippingAddress: ship }
    // (তোমার backend এ /me আছে)
    return await api.putAuth("/api/auth/me", token, { shippingAddress: ship });
  };

  const [book, setBook] = useState<Book>(() => loadBook());
  const [useNew, setUseNew] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>(book.selectedId || "");
  const [shipping, setShipping] = useState<Shipping>(() => emptyShipping(user));

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "FULL_PAYMENT">("COD");
  const deliveryCharge = 110;

  // ✅ orderItems: buyMode হলে শুধু checkoutItem, না হলে cart items
  const orderItems = useMemo(() => {
    if (buyMode) return cart?.checkoutItem ? [cart.checkoutItem] : [];
    return Array.isArray(cart?.items) ? cart.items : [];
  }, [buyMode, cart?.items, cart?.checkoutItem]);

  const subTotal = useMemo(() => {
    return orderItems.reduce(
      (s: number, it: any) => s + Number(it?.price || 0) * Number(it?.qty || 0),
      0
    );
  }, [orderItems]);

  const total = subTotal + deliveryCharge;

  // ✅ when user loads / book changes -> set initial shipping
  useEffect(() => {
    const b = loadBook();
    setBook(b);

    const sid = b.selectedId || b.items?.[0]?.id || "";
    setSelectedId(sid);

    if (!sid) {
      // 🔥 FIX: localStorage না থাকলে DB address ব্যবহার করো
      if (user?.shippingAddress && Object.keys(user.shippingAddress).length > 0) {
        setUseNew(false);
        setShipping({ ...emptyShipping(user), ...(user.shippingAddress as Shipping) });
      } else {
        setUseNew(true);
        setShipping(emptyShipping(user));
      }
      return;
    }

    const found = b.items.find((x) => x.id === sid);
    if (found?.shipping) {
      setUseNew(false);
      setShipping({ ...emptyShipping(user), ...found.shipping });
    } else {
      setUseNew(true);
      setShipping(emptyShipping(user));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ✅ when selectedId changes -> update shipping from book (only if not useNew)
  useEffect(() => {
    if (useNew) return;
    const found = book.items.find((x) => x.id === selectedId);
    if (found?.shipping) {
      setShipping({ ...emptyShipping(user), ...found.shipping });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, useNew, book.items, user]);

  // ✅ buyMode: checkoutItem না থাকলে user কে shop/cart এ পাঠাবে
  if (!orderItems.length) {
    return (
      <div className="container">
        No item selected{" "}
        <button
          className="btnGhost"
          type="button"
          onClick={() => router.push(buyMode ? "/shop" : "/cart")}
        >
          Go {buyMode ? "shop" : "cart"}
        </button>
      </div>
    );
  }

  const validateShipping = () => {
    if (!shipping.fullName) return "Name required";
    if (!shipping.phone1) return "Phone required";
    if (!shipping.division) return "Division required";
    if (!shipping.district) return "District required";
    if (!shipping.upazila) return "Upazila/Thana required";
    if (!shipping.addressLine) return "Address required";
    return "";
  };

  const saveToBook = (ship: Shipping) => {
    const current = loadBook();

    // update existing saved
    if (!useNew && selectedId) {
      const nextItems = current.items.map((x) =>
        x.id === selectedId ? { ...x, shipping: ship, label: x.label || makeLabel(ship) } : x
      );

      const next = { ...current, selectedId, items: nextItems };
      localStorage.setItem(BOOK_KEY, JSON.stringify(next));
      setBook(next);
      return;
    }

    // create new saved
    const id = uid();
    const nextItems = [{ id, label: makeLabel(ship), shipping: ship }, ...(current.items || [])];

    const next = { selectedId: id, items: nextItems };
    localStorage.setItem(BOOK_KEY, JSON.stringify(next));

    setBook(next);
    setSelectedId(id);
    setUseNew(false);
  };

  const deleteAddress = (id: string) => {
    const current = loadBook();
    const nextItems = (current.items || []).filter((x) => x.id !== id);

    const nextSelected =
      current.selectedId === id ? nextItems[0]?.id || "" : current.selectedId;

    const next = { selectedId: nextSelected, items: nextItems };
    localStorage.setItem(BOOK_KEY, JSON.stringify(next));

    setBook(next);
    setSelectedId(nextSelected);

    if (!nextSelected) {
      setUseNew(true);
      setShipping(emptyShipping(user));
    } else {
      setUseNew(false);
      const found = nextItems.find((x) => x.id === nextSelected);
      if (found?.shipping) setShipping({ ...emptyShipping(user), ...found.shipping });
    }
  };

  const placeOrder = async () => {
    if (!token) {
      router.push("/login");
      return;
    }

    const m = validateShipping();
    if (m) return alert(m);

    // ✅ DB-তে shippingAddress save (multi-device fix)
    const db = await saveShippingToDB(shipping);
    if (!db?.ok) return alert(db?.message || "Address DB save failed");

    // ✅ local book save (same as old)
    saveToBook(shipping);

    const payload = {
      items: orderItems.map((x: any) => ({
        productId: x.productId,
        qty: x.qty,
        variant: x.variant,
      })),
      shipping,
      paymentMethod,
    };

    // ✅ Next.js version: postAuth
    const r = await api.postAuth("/api/orders", token, payload);
    if (!r?.ok) return alert(r?.message || "Order failed");

    if (buyMode) cart?.clearBuyNow?.();
    else cart?.clear?.();

    alert("✅ Order placed!");
    router.push("/profile");
  };

  return (
    <div className="container">
      <h2>Shipping Details</h2>

      {/* ✅ Saved addresses */}
      {book.items?.length > 0 && (
        <div className="box" style={{ marginBottom: 14 }}>
          <div className="rowBetween">
            <b>Saved Addresses</b>

            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setUseNew(true);
                setShipping(emptyShipping(user));
              }}
            >
              + New Shipping Details
            </button>
          </div>

          {!useNew && (
            <div style={{ marginTop: 10 }}>
              {book.items.map((x) => (
                <div
                  key={x.id}
                  className="rowBetween"
                  style={{
                    padding: "8px 10px",
                    border: "1px solid #eee",
                    borderRadius: 8,
                    marginBottom: 8,
                    background: selectedId === x.id ? "#f7f7ff" : "#fff",
                  }}
                >
                  <label style={{ cursor: "pointer", flex: 1 }}>
                    <input
                      type="radio"
                      checked={selectedId === x.id}
                      onChange={() => setSelectedId(x.id)}
                      style={{ marginRight: 8 }}
                    />
                    {x.label}
                  </label>

                  <button
                    type="button"
                    className="btnGhost"
                    style={{ color: "crimson", borderColor: "#ffd6d6" }}
                    onClick={() => {
                      if (!confirm("Delete this address?")) return;
                      deleteAddress(x.id);
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {useNew && (
            <div className="muted" style={{ marginTop: 10 }}>
              New address mode — নিচে নতুন ঠিকানা লিখে “Save &amp; Use” করো
            </div>
          )}
        </div>
      )}

      <div className="box">
        <label className="lbl">আপনার নাম</label>
        <input
          className="input"
          value={shipping.fullName}
          onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
        />

        <label className="lbl">মোবাইল নাম্বার</label>
        <input
          className="input"
          value={shipping.phone1}
          onChange={(e) => setShipping({ ...shipping, phone1: e.target.value })}
        />

        <label className="lbl">মোবাইল নাম্বার 2 (optional)</label>
        <input
          className="input"
          value={shipping.phone2}
          onChange={(e) => setShipping({ ...shipping, phone2: e.target.value })}
        />

        <label className="lbl">বিভাগ</label>
        <select
          className="input"
          value={shipping.division}
          onChange={(e) => setShipping({ ...shipping, division: e.target.value })}
        >
          {DIVISIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <label className="lbl">জেলা</label>
        <input
          className="input"
          value={shipping.district}
          onChange={(e) => setShipping({ ...shipping, district: e.target.value })}
        />

        <label className="lbl">উপজেলা/থানা</label>
        <input
          className="input"
          value={shipping.upazila}
          onChange={(e) => setShipping({ ...shipping, upazila: e.target.value })}
        />

        <label className="lbl">সম্পূর্ণ ঠিকানা (থানা সহ লিখে দিবেন)</label>
        <input
          className="input"
          value={shipping.addressLine}
          onChange={(e) => setShipping({ ...shipping, addressLine: e.target.value })}
        />

        <label className="lbl">অর্ডার নোট (Optional)</label>
        <textarea
          className="input"
          rows={3}
          value={shipping.note}
          onChange={(e) => setShipping({ ...shipping, note: e.target.value })}
        />

        <div className="rowBetween" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btnGhost"
            onClick={async () => {
              const m = validateShipping();
              if (m) return alert(m);

              const db = await saveShippingToDB(shipping);
              if (!db?.ok) return alert(db?.message || "Address DB save failed");

              saveToBook(shipping);
              alert("✅ Address saved!");
            }}
          >
            Save &amp; Use
          </button>

          {book.items?.length > 0 && (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setUseNew(false);
                const sid = book.selectedId || book.items?.[0]?.id || "";
                setSelectedId(sid);
                const found = book.items.find((x) => x.id === sid);
                if (found?.shipping) setShipping({ ...emptyShipping(user), ...found.shipping });
              }}
            >
              Use Saved Address
            </button>
          )}
        </div>

        <div className="box" style={{ marginTop: 12 }}>
          <div className="rowBetween">
            <span>Sub Total:</span>
            <b>৳ {subTotal}</b>
          </div>
          <div className="rowBetween">
            <span>Delivery Charge:</span>
            <b>৳ {deliveryCharge}</b>
          </div>
          <div className="rowBetween">
            <span>Total:</span>
            <b>৳ {total}</b>
          </div>
        </div>

        <div className="rowBetween" style={{ marginTop: 10 }}>
          <label className="radio">
            <input
              type="radio"
              checked={paymentMethod === "FULL_PAYMENT"}
              onChange={() => setPaymentMethod("FULL_PAYMENT")}
            />
            Full Payment
          </label>

          <label className="radio">
            <input
              type="radio"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
            />
            Cash On Delivery
          </label>
        </div>

        <button className="btnPinkFull" type="button" onClick={placeOrder} style={{ marginTop: 12 }}>
          অর্ডার নিশ্চিত করুন
        </button>
      </div>
    </div>
  );
}