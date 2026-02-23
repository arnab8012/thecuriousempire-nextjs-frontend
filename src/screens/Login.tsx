"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { useLocation } from "@/utils/useLocation";
import { useNavigate } from "@/utils/useNavigate";
import { useAuth } from "../context/AuthContext";
import useNoIndex from "../utils/useNoIndex";

export default function Login() {
  useNoIndex("noindex, nofollow");
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const r = await login(phone, password);
      if (r?.ok === false) throw new Error(r.message || "Login failed");

      const back = loc.state?.from || "/profile";
      nav(back, { replace: true });
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container authPage" style={{ maxWidth: 520 }}>
      <h2 className="authH" style={{ marginTop: 8 }}>
        Login
      </h2>

      <form onSubmit={onSubmit} className="box authCard" style={{ marginTop: 10 }}>
        <label className="lbl">Phone</label>
        <input
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
        />

        <label className="lbl" style={{ marginTop: 10 }}>
          Password
        </label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {/* ✅ Forgot Password link */}
        <div style={{ marginTop: 10, textAlign: "right" }}>
          <Link
            to="/forgot-password"
            style={{ fontWeight: 900, textDecoration: "none" }}
          >
            Forgot Password?
          </Link>
        </div>

        <button
          className="btnPrimary authBtn"
          disabled={loading}
          style={{ marginTop: 14, width: "100%" }}
          type="submit"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <div className="muted" style={{ marginTop: 10 }}>
          No account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}