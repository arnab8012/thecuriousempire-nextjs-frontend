"use client";

import { useState } from "react";
import { useNavigate } from "@/utils/useNavigate";
import Link from "@/components/Link";
import { api } from "../api/api";
import useNoIndex from "../utils/useNoIndex";

export default function ForgotPassword() {
  useNoIndex("noindex, nofollow");
  const nav = useNavigate();

  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const show = (t: string) => {
    setMsg(t);
    if (typeof window === "undefined") return;
    try {
      window.clearTimeout((window as any).__fp_msg);
      (window as any).__fp_msg = window.setTimeout(() => setMsg(""), 1800);
    } catch {}
  };

  const submit = async (e: any) => {
    e.preventDefault();

    const p = String(phone || "").trim();
    const n = String(fullName || "").trim();
    const pw = String(newPassword || "").trim();

    if (!p || !n || !pw) {
      show("Phone, Full Name, New Password লাগবে");
      return;
    }

    // Basic validation (BD)
    if (!/^01\d{9}$/.test(p)) {
      show("সঠিক ফোন নাম্বার দিন (01XXXXXXXXX)");
      return;
    }

    if (pw.length < 6) {
      show("Password কমপক্ষে 6 অক্ষর হতে হবে");
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      const r = await api.post("/api/auth/reset-password", {
        phone: p,
        fullName: n,
        newPassword: pw,
      });

      if (!r?.ok) {
        show(r?.message || "Failed to reset password");
        return;
      }

      show("✅ Password updated! এখন Login করো");
      nav("/login");
    } catch (err: any) {
      show(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="authCard fpCard">
        {msg ? (
          <div
            style={{
              marginBottom: 10,
              background: "rgba(0,0,0,0.78)",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            {msg}
          </div>
        ) : null}

        <h2 className="authTitle">Forgot Password</h2>

        <form onSubmit={submit}>
          <label className="lbl">Phone Number</label>
          <input
            className="inp"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            inputMode="numeric"
          />

          <label className="lbl">Full Name (যেটা দিয়ে Register করেছিলে)</label>
          <input
            className="inp"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
          />

          <label className="lbl">New Password</label>
          <input
            className="inp"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
          />

          <button className="btnPinkFull" type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Reset Password"}
          </button>

          <div className="fpBottom">
            <Link to="/login" className="fpLink">
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}