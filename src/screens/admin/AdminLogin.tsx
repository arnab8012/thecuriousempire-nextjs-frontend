"use client";

import { useState } from "react";
import { useNavigate } from "@/utils/useNavigate";
import { useLocation } from "@/utils/useLocation";
import { api } from "../../api/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const loc = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const r = await api.post("/api/admin-auth/login", { email, password });

    setLoading(false);

    if (!r?.ok) {
      alert(r?.message || "Admin login failed");
      return;
    }

    localStorage.setItem("admin_token", r.token);

    const go = loc.state?.from || "/admin";
    nav(go, { replace: true });
  };

  return (
    <div className="authWrap">
      <div className="authCard">
        <h2 className="authTitle">Admin Login</h2>

        <form onSubmit={submit}>
          <label className="lbl">Email</label>
          <input
            className="inp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin email"
            autoComplete="username"
          />

          <label className="lbl" style={{ marginTop: 12 }}>Password</label>
          <input
            className="inp"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin password"
            autoComplete="current-password"
          />

          <button className="btn" disabled={loading} style={{ marginTop: 14 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}