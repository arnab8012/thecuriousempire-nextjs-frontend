"use client";

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

// CartContext keys (তোমার CartContext এ দেওয়া)
const CART_KEY = "cart_items_v1";
const BUY_KEY = "buy_now_item_v1";

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

function isShipMeaningful(s: any) {
  if (!s) return false;
  const fullName = String(s.fullName || "").trim();
  const phone1 = String(s.phone1 || "").trim();
  const district = String(s.district || "").trim();
  const upazila = String(s.upazila || "").trim();
  const addressLine = String(s.addressLine || "").trim();
  // ✅ minimal required (তোমার backend shipping validation মতো)
  return !!(fullName && phone1 && district && upazila && addressLine);
}

function loadBookClean(): Book {
  if (typeof window === "undefined") return { selectedId: "", items: [] };

  try {
    const raw = localStorage.getItem(BOOK_KEY) || "";
    const b = raw ? JSON.parse(raw) : {};
    const items: BookItem[] = Array.isArray(b?.items) ? b.items : [];

    // ✅ remove blank addresses from book
    const cleanedItems = items.filter((x) => isShipMeaningful(x?.shipping));

    // ✅ if book had only blank -> wipe it
    if (items.length > 0 && cleanedItems.length === 0) {
      localStorage.removeItem(BOOK_KEY);
      return { selectedId: "", items: [] };
    }

    const selectedId = String(b?.selectedId || "");
    // ✅ if selectedId points to removed item -> fallback first
    const selectedExists = cleanedItems.some((x) => x.id === selectedId);
    const sid = selectedExists ? selectedId : cleanedItems[0]?.id || "";

    // ✅ persist cleaned book back (so problem never returns)
    const next = { selectedId: sid, items: cleanedItems };
    localStorage.setItem(BOOK_KEY, JSON.stringify(next));

    return next;
  } catch {
    return { selectedId: "", items: [] };
  }
}

function safeJsonGet(key: string, fallback: any) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
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
  const deliveryCharge = 110;

  // ✅ legacy single shippingAddress save (তোমার backend PUT /api/auth/me handle করে)
  const saveShippingToDB = async (ship: Shipping) => {
    if (!token) return { ok: false, message: "No token" };
    return await api.putAuth("/api/auth/me", token, { shippingAddress: ship });
  };

  const [book, setBook] = useState<Book>(() => loadBookClean());
  const [useNew, setUseNew] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>(book.selectedId || "");
  const [shipping, setShipping] = useState<Shipping>(() => emptyShipping(user));

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "FULL_PAYMENT">("COD");

  // ✅ orderItems (UI show) - context first
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

  // ✅ initial load: book -> else DB shippingAddress
  useEffect(() => {
    const b = loadBookClean();
    setBook(b);

    const sid = b.selectedId || b.items?.[0]?.id || "";
    setSelectedId(sid);

    if (!sid) {
      // ✅ book নেই -> DB address দেখাও
      const dbShip = user?.shippingAddress;
      if (dbShip && isShipMeaningful(dbShip)) {
        setUseNew(false);
        setShipping({ ...emptyShipping(user), ...(dbShip as Shipping) });
      } else {
        setUseNew(true);
        setShipping(emptyShipping(user));
      }
      return;
    }

    const found = b.items.find((x) => x.id === sid);
    if (found?.shipping && isShipMeaningful(found.shipping)) {
      setUseNew(false);
      setShipping({ ...emptyShipping(user), ...found.shipping });
    } else {
      // ✅ selected blank হলে DB fallback
      const dbShip = user?.shippingAddress;
      if (dbShip && isShipMeaningful(dbShip)) {
        setUseNew(false);
        setShipping({ ...emptyShipping(user), ...(dbShip as Shipping) });
      } else {
        setUseNew(true);
        setShipping(emptyShipping(user));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id || user?.id]);

  // ✅ when selecting saved item
  useEffect(() => {
    if (useNew) return;
    const found = book.items.find((x) => x.id === selectedId);
    if (found?.shipping && isShipMeaningful(found.shipping)) {
      setShipping({ ...emptyShipping(user), ...found.shipping });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, useNew, book.items]);

  const validateShipping = () => {
    if (!String(shipping.fullName || "").trim()) return "Name required";
    if (!String(shipping.phone1 || "").trim()) return "Phone required";
    if (!String(shipping.division || "").trim()) return "Division required";
    if (!String(shipping.district || "").trim()) return "District required";
    if (!String(shipping.upazila || "").trim()) return "Upazila/Thana required";
    if (!String(shipping.addressLine || "").trim()) return "Address required";
    return "";
  };

  const saveToBook = (ship: Shipping) => {
    if (!isShipMeaningful(ship)) return; // ✅ never save blank

    const current = loadBookClean();

    // update existing
    if (!useNew && selectedId) {
      const nextItems = current.items.map((x) =>
        x.id === selectedId ? { ...x, shipping: ship, label: x.label || makeLabel(ship) } : x
      );
      const next = { ...current, selectedId, items: nextItems };
      localStorage.setItem(BOOK_KEY, JSON.stringify(next));
      setBook(next);
      return;
    }

    // create new
    const id = uid();
    const nextItems = [{ id, label: makeLabel(ship), shipping: ship }, ...(current.items || [])];
    const next = { selectedId: id, items: nextItems };

    localStorage.setItem(BOOK_KEY, JSON.stringify(next));
    setBook(next);
    setSelectedId(id);
    setUseNew(false);
  };

  const deleteAddress = (id: string) => {
    const current = loadBookClean();
    const nextItems = (current.items || []).filter((x) => x.id !== id);
    const nextSelected = current.selectedId === id ? nextItems[0]?.id || "" : current.selectedId;

    const next = { selectedId: nextSelected, items: nextItems };
    localStorage.setItem(BOOK_KEY, JSON.stringify(next));

    setBook(next);
    setSelectedId(nextSelected);

    if (!nextSelected) {
      // ✅ fallback to DB
      const dbShip = user?.shippingAddress;
      if (dbShip && isShipMeaningful(dbShip)) {
        setUseNew(false);
        setShipping({ ...emptyShipping(user), ...(dbShip as Shipping) });
      } else {
        setUseNew(true);
        setShipping(emptyShipping(user));
      }
    } else {
      setUseNew(false);
      const found = nextItems.find((x) => x.id === nextSelected);
      if (found?.shipping && isShipMeaningful(found.shipping)) {
        setShipping({ ...emptyShipping(user), ...found.shipping });
      }
    }
  };

  // ✅ HARD FIX for "No items": build items from context OR localStorage at click time
  const buildFinalItems = () => {
    // 1) context
    let list: any[] = [];
    if (buyMode) {
      if (cart?.checkoutItem) list = [cart.checkoutItem];
    } else {
      if (Array.isArray(cart?.items)) list = cart.items;
    }

    // 2) fallback localStorage (when context empty)
    if (!list.length) {
      if (buyMode) {
        const one = safeJsonGet(BUY_KEY, null);
        if (one) list = [one];
      } else {
        const arr = safeJsonGet(CART_KEY, []);
        if (Array.isArray(arr)) list = arr;
      }
    }

    // normalize payload items
    const payloadItems = (list || [])
      .map((x: any) => ({
        productId: String(x?.productId || x?._id || x?.id || "").trim(),
        qty: Math.max(1, Number(x?.qty || 1)),
        variant: String(x?.variant || ""),
      }))
      .filter((x) => !!x.productId); // ✅ remove invalid

    return payloadItems;
  };

  const placeOrder = async () => {
    if (!token) {
      router.push("/login");
      return;
    }

    const m = validateShipping();
    if (m) return alert(m);

    // ✅ items build (context OR localStorage)
    const finalItems = buildFinalItems();
    if (!finalItems.length) return alert("No items"); // ✅ same message, but now real

    // ✅ save shipping to DB (legacy single)
    const db = await saveShippingToDB(shipping);
    if (!db?.ok) return alert(db?.message || "Address DB save failed");

    // ✅ local book save
    saveToBook(shipping);

    const payload = {
      items: finalItems,
      shipping,
      paymentMethod,
    };

    const r = await api.postAuth("/api/orders", token, payload);
    if (!r?.ok) return alert(r?.message || "Order failed");

    if (buyMode) cart?.clearBuyNow?.();
    else cart?.clear?.();

    alert("✅ Order placed!");
    router.push("/profile");
  };

  // ✅ UI guard (only for UI)
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