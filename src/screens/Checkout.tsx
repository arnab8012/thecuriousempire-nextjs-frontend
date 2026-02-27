"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";

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

type Shipping = {
  label?: string;
  fullName: string;
  phone1: string;
  phone2?: string;
  division: string;
  district: string;
  upazila: string;
  union?: string;
  postCode?: string;
  addressLine: string;
  note?: string;
  isDefault?: boolean;
};

type SavedAddress = {
  _id: string;
  label?: string;
  isDefault?: boolean;
} & Shipping;

function emptyShipping(user: any): Shipping {
  return {
    label: "Home",
    fullName: user?.fullName || "",
    phone1: user?.phone || "",
    phone2: "",
    division: "Dhaka",
    district: "",
    upazila: "",
    addressLine: "",
    note: "",
    isDefault: false,
  };
}

function makeLabel(s: Shipping) {
  const a = [s.label, s.fullName, s.phone1, s.division, s.district, s.upazila]
    .filter(Boolean)
    .join(" | ");
  return a.length > 80 ? a.slice(0, 80) + "..." : a || "Address";
}

export default function Checkout() {
  const router = useRouter();
  const sp = useSearchParams();
  const mode = sp.get("mode") || ""; // "buy" | ""
  const buyMode = mode === "buy";

  const cart = useCart() as any;
  const { user } = useAuth();

  const token = api.token();

  // ✅ order items
  const orderItems = useMemo(() => {
    if (buyMode) return cart?.checkoutItem ? [cart.checkoutItem] : [];
    return Array.isArray(cart?.items) ? cart.items : [];
  }, [buyMode, cart?.items, cart?.checkoutItem]);

  // ✅ totals
  const deliveryCharge = 110;

  const subTotal = useMemo(() => {
    return orderItems.reduce(
      (s: number, it: any) => s + Number(it?.price || 0) * Number(it?.qty || 0),
      0
    );
  }, [orderItems]);

  const total = subTotal + deliveryCharge;

  // ✅ DB address book
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [useNew, setUseNew] = useState<boolean>(false);

  // ✅ current shipping form state
  const [shipping, setShipping] = useState<Shipping>(emptyShipping(user));

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "FULL_PAYMENT">("COD");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const show = (t: string) => {
    setMsg(t);
    if (typeof window === "undefined") return;
    try {
      window.clearTimeout((window as any).__co_msg);
      (window as any).__co_msg = window.setTimeout(() => setMsg(""), 1400);
    } catch {}
  };

  // ✅ guards
  useEffect(() => {
    if (!token)
      router.replace(
        "/login?next=" +
          encodeURIComponent("/checkout" + (sp.toString() ? `?${sp.toString()}` : ""))
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!orderItems.length) {
      router.replace(buyMode ? "/shop" : "/cart");
    }
  }, [orderItems.length, router, buyMode]);

  // ✅ Load DB addresses from /me
  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!token) return;

      try {
        const r = await api.getAuth("/api/auth/me", token);
        if (!alive) return;

        if (r?.ok && r?.user) {
          const list: SavedAddress[] = Array.isArray(r.user.shippingAddresses)
            ? r.user.shippingAddresses
            : [];

          setSaved(list);

          // pick default
          const def = list.find((x) => x?.isDefault) || list[0];
          if (def?._id) {
            setSelectedId(def._id);
            setUseNew(false);
            setShipping({
              ...emptyShipping(r.user),
              ...def,
              division: def.division || "Dhaka",
            });
          } else {
            // fallback: if old single shippingAddress exists
            const old = r.user.shippingAddress || {};
            const hasOld = old && Object.keys(old).length > 0;
            if (hasOld) {
              setUseNew(false);
              setShipping({
                ...emptyShipping(r.user),
                ...old,
                division: old.division || "Dhaka",
              });
            } else {
              setUseNew(true);
              setShipping(emptyShipping(r.user));
            }
          }
        }
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [token]);

  // ✅ when selectedId changes, load that address into form
  useEffect(() => {
    if (useNew) return;
    const found = saved.find((x) => x._id === selectedId);
    if (found) {
      setShipping({
        ...emptyShipping(user),
        ...found,
        division: found.division || "Dhaka",
      });
    }
    // ✅ FIX: saved dependency add (তোমার কোড বাদ না দিয়ে শুধু fix)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, useNew, saved]);

  // ✅ validate
  const validateShipping = () => {
    if (!shipping.fullName?.trim()) return "Name required";
    if (!shipping.phone1?.trim()) return "Phone required";
    if (!shipping.division?.trim()) return "Division required";
    if (!shipping.district?.trim()) return "District required";
    if (!shipping.upazila?.trim()) return "Upazila/Thana required";
    if (!shipping.addressLine?.trim()) return "Address required";
    return "";
  };

  // ✅ DB actions
  const setDefaultInDB = async (id: string) => {
    if (!token || !id) return;
    try {
      await api.postAuth(`/api/auth/shipping/${id}/default`, token, {});
    } catch {}
  };

  const createAddressInDB = async (ship: Shipping) => {
    if (!token) return { ok: false, message: "No token" };
    return await api.postAuth("/api/auth/shipping", token, {
      ...ship,
      label: ship.label || makeLabel(ship),
      // ✅ FIX: setDefault বাদ, backend-compatible
      isDefault: true,
    });
  };

  const updateAddressInDB = async (id: string, ship: Shipping) => {
    if (!token) return { ok: false, message: "No token" };
    return await api.putAuth(`/api/auth/shipping/${id}`, token, {
      ...ship,
      label: ship.label || makeLabel(ship),
      // ✅ FIX: setDefault বাদ, backend-compatible
      isDefault: true,
    });
  };

  const deleteAddressInDB = async (id: string) => {
    if (!token) return { ok: false, message: "No token" };
    return await api.deleteAuth(`/api/auth/shipping/${id}`, token);
  };

  // ✅ Save & Use (new OR update)
  const saveAndUse = async () => {
    const m = validateShipping();
    if (m) return show(m);

    setLoading(true);
    try {
      const r =
        !useNew && selectedId
          ? await updateAddressInDB(selectedId, shipping)
          : await createAddressInDB(shipping);

      if (!r?.ok) {
        show(r?.message || "Address save failed");
        return;
      }

      const list: SavedAddress[] = Array.isArray(r.user?.shippingAddresses)
        ? r.user.shippingAddresses
        : [];

      setSaved(list);

      const def = list.find((x) => x.isDefault) || list[0];
      if (def?._id) {
        setSelectedId(def._id);
        setUseNew(false);
        setShipping({
          ...emptyShipping(r.user),
          ...def,
          division: def.division || "Dhaka",
        });
      }

      show("✅ Address saved");
    } finally {
      setLoading(false);
    }
  };

  // ✅ When selecting saved address -> also set default in DB (multi-device)
  const onSelectSaved = async (id: string) => {
    setSelectedId(id);
    setUseNew(false);
    await setDefaultInDB(id);
  };

  const onDeleteSaved = async (id: string) => {
    if (!confirm("Delete this address?")) return;

    setLoading(true);
    try {
      const r = await deleteAddressInDB(id);
      if (!r?.ok) {
        show(r?.message || "Delete failed");
        return;
      }

      // ✅ guard: token না থাকলে আর fetch করবে না
      if (!token) {
        setSaved([]);
        setSelectedId("");
        setUseNew(true);
        setShipping(emptyShipping(user));
        show("Deleted ✅");
        return;
      }

      const me = await api.getAuth("/api/auth/me", token);
      const list: SavedAddress[] = Array.isArray(me?.user?.shippingAddresses)
        ? me.user.shippingAddresses
        : [];
      setSaved(list);

      const def = list.find((x) => x.isDefault) || list[0];
      if (def?._id) {
        setSelectedId(def._id);
        setUseNew(false);
        setShipping({
          ...emptyShipping(me.user),
          ...def,
          division: def.division || "Dhaka",
        });
      } else {
        setSelectedId("");
        setUseNew(true);
        setShipping(emptyShipping(me?.user || user));
      }

      show("Deleted ✅");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Place order
  const placeOrder = async () => {
    if (!token) return router.push("/login");
    const m = validateShipping();
    if (m) return show(m);

    setLoading(true);
    try {
      const r =
        !useNew && selectedId
          ? await updateAddressInDB(selectedId, shipping)
          : await createAddressInDB(shipping);

      if (!r?.ok) {
        show(r?.message || "Address DB save failed");
        return;
      }

      const payload = {
        items: orderItems.map((x: any) => ({
          productId: x.productId,
          qty: x.qty,
          variant: x.variant || "",
          title: x.title,
          price: x.price,
          image: x.image,
        })),
        shipping: {
          ...shipping,
          label: shipping.label || makeLabel(shipping),
        },
        paymentMethod,
        deliveryCharge,
        subTotal,
        total,
        mode: buyMode ? "buy" : "cart",
      };

      const or = await api.postAuth("/api/orders", token, payload);
      if (!or?.ok) {
        show(or?.message || "Order failed");
        return;
      }

      if (buyMode) cart?.clearBuyNow?.();
      else cart?.clear?.();

      show("✅ Order placed!");
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 140 }}>
      {msg ? (
        <div
          style={{
            position: "sticky",
            top: 8,
            zIndex: 10,
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            padding: "10px 12px",
            borderRadius: 12,
            width: "fit-content",
            fontWeight: 800,
          }}
        >
          {msg}
        </div>
      ) : null}

      <h2 style={{ marginTop: 10 }}>Shipping Details</h2>

      {/* ✅ Saved addresses */}
      {saved.length > 0 && (
        <div className="box" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <b>Saved Addresses</b>

            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setUseNew(true);
                setSelectedId("");
                setShipping(emptyShipping(user));
              }}
            >
              + New Shipping Details
            </button>
          </div>

          {!useNew && (
            <div style={{ marginTop: 10 }}>
              {saved.map((x) => (
                <div
                  key={x._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 10px",
                    border: "1px solid #eee",
                    borderRadius: 8,
                    marginBottom: 8,
                    background: selectedId === x._id ? "#f7f7ff" : "#fff",
                  }}
                >
                  <label style={{ cursor: "pointer", flex: 1 }}>
                    <input
                      type="radio"
                      checked={selectedId === x._id}
                      onChange={() => onSelectSaved(x._id)}
                      style={{ marginRight: 8 }}
                    />
                    {(x.label || makeLabel(x)) + (x.isDefault ? " ✅" : "")}
                  </label>

                  <button
                    type="button"
                    className="btnGhost"
                    style={{ color: "crimson", borderColor: "#ffd6d6" }}
                    onClick={() => onDeleteSaved(x._id)}
                    disabled={loading}
                  >
                    🗑 Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          {useNew && (
            <div className="muted" style={{ marginTop: 10 }}>
              New address mode — নিচে নতুন ঠিকানা লিখে “Save & Use” করো
            </div>
          )}
        </div>
      )}

      {/* ✅ Form */}
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
          value={shipping.phone2 || ""}
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
          value={shipping.note || ""}
          onChange={(e) => setShipping({ ...shipping, note: e.target.value })}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <button type="button" className="btnGhost" onClick={saveAndUse} disabled={loading}>
            {loading ? "Saving..." : "Save & Use"}
          </button>

          {saved.length > 0 && (
            <button
              type="button"
              className="btnGhost"
              onClick={() => {
                setUseNew(false);
                const def = saved.find((x) => x.isDefault) || saved[0];
                if (def?._id) onSelectSaved(def._id);
              }}
              disabled={loading}
            >
              Use Saved Address
            </button>
          )}
        </div>

        {/* totals */}
        <div className="box" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Sub Total:</span>
            <b>৳ {subTotal}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Delivery Charge:</span>
            <b>৳ {deliveryCharge}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total:</span>
            <b>৳ {total}</b>
          </div>
        </div>

        {/* payment */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
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

        <button
          className="btnPinkFull"
          type="button"
          onClick={placeOrder}
          style={{ marginTop: 12 }}
          disabled={loading}
        >
          {loading ? "Processing..." : "অর্ডার নিশ্চিত করুন"}
        </button>
      </div>
    </div>
  );
}