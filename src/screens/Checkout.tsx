"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "../context/CartContext";
import { api } from "../api/api";

function getToken() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

export default function Checkout() {
  const router = useRouter();
  const sp = useSearchParams();

  const mode = sp.get("mode") || ""; // buy / cart
  const cart = useCart() as any;

  // cart items / buy-now item
  const items = useMemo(() => {
    if (mode === "buy") {
      return cart?.checkoutItem ? [cart.checkoutItem] : [];
    }
    return Array.isArray(cart?.items) ? cart.items : [];
  }, [mode, cart?.items, cart?.checkoutItem]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payMode, setPayMode] = useState<"cod" | "full">("cod");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const nextUrl = useMemo(() => {
    const q = sp.toString();
    return `/checkout${q ? `?${q}` : ""}`;
  }, [sp]);

  // ✅ Guard: token না থাকলে checkout এ থাকবে না
  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace(`/login?next=${encodeURIComponent(nextUrl)}`);
    }
  }, [router, nextUrl]);

  // ✅ Guard: cart empty হলে back
  useEffect(() => {
    if (!items.length) {
      router.replace("/cart");
    }
  }, [items.length, router]);

  const total = useMemo(() => {
    return items.reduce((s: number, x: any) => s + Number(x?.price || 0) * Number(x?.qty || 0), 0);
  }, [items]);

  const show = (t: string) => {
    setMsg(t);
    if (typeof window === "undefined") return;
    try {
      window.clearTimeout((window as any).__co_msg);
      (window as any).__co_msg = window.setTimeout(() => setMsg(""), 1400);
    } catch {}
  };

  const submit = async () => {
    const token = getToken();
    if (!token) {
      // ✅ আগের alert("No token") এর বদলে login এ পাঠাবে
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    if (!name.trim() || !phone.trim() || !district.trim() || !thana.trim() || !address.trim()) {
      show("সব ফিল্ড পূরণ করুন");
      return;
    }

    if (!items.length) {
      show("Cart empty");
      router.push("/cart");
      return;
    }

    const payload = {
      customerName: name.trim(),
      phone: phone.trim(),
      district: district.trim(),
      thana: thana.trim(),
      address: address.trim(),
      note: note.trim(),
      paymentMode: payMode, // "cod" | "full"
      items: items.map((x: any) => ({
        productId: x.productId,
        title: x.title,
        price: x.price,
        qty: x.qty,
        variant: x.variant || "",
        image: x.image || "",
      })),
      total,
      mode: mode || "cart",
    };

    try {
      setLoading(true);

      // ✅ তোমার api wrapper এ যদি postAuth থাকে, এটা ব্যবহার করো:
      // const r = await api.postAuth("/api/orders", token, payload);

      // ✅ যদি না থাকে, তাহলে api.post এর ভিতর headers সাপোর্ট থাকলে:
      const r =
        typeof api.postAuth === "function"
          ? await api.postAuth("/api/orders", token, payload)
          : await api.post("/api/orders", payload, {
              headers: { Authorization: `Bearer ${token}` },
            });

      if (r?.ok) {
        show("Order placed ✅");

        // cart clear
        if (mode === "buy") {
          cart?.clearBuyNow?.();
        } else {
          cart?.clear?.();
        }

        router.push("/"); // বা তোমার success page
      } else {
        show(r?.message || "Order failed");
      }
    } catch (e: any) {
      show(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 140 }}>
      {msg ? (
        <div style={{ position: "sticky", top: 8, zIndex: 10, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "10px 12px", borderRadius: 12, width: "fit-content", fontWeight: 800 }}>
          {msg}
        </div>
      ) : null}

      <h2 style={{ marginTop: 10 }}>Checkout</h2>

      {/* তোমার UI input class গুলো 그대로 রাখলাম */}
      <div className="box">
        <div className="lbl">নাম</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="box">
        <div className="lbl">ফোন</div>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <div className="box">
        <div className="lbl">জেলা</div>
        <input className="input" value={district} onChange={(e) => setDistrict(e.target.value)} />
      </div>

      <div className="box">
        <div className="lbl">উপজেলা/থানা</div>
        <input className="input" value={thana} onChange={(e) => setThana(e.target.value)} />
      </div>

      <div className="box">
        <div className="lbl">সম্পূর্ণ ঠিকানা</div>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      <div className="box">
        <div className="lbl">অর্ডার নোট (Optional)</div>
        <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="box">
        <div className="lbl">Payment</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="radio" checked={payMode === "full"} onChange={() => setPayMode("full")} />
            Full Payment
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="radio" checked={payMode === "cod"} onChange={() => setPayMode("cod")} />
            Cash On Delivery
          </label>
        </div>
      </div>

      <div className="box">
        <div style={{ fontWeight: 900 }}>Total: ৳ {total}</div>
      </div>

      <button className="btnPrimary" type="button" onClick={submit} disabled={loading}>
        {loading ? "Processing..." : "অর্ডার নিশ্চিত করুন"}
      </button>
    </div>
  );
}