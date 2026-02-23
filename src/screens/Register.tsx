"use client";

import { useState } from "react";
import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";
import { useAuth } from "../context/AuthContext";
import useNoIndex from "../utils/useNoIndex";


export default function Register() {
  useNoIndex("noindex, nofollow");
  const nav = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const name = fullName.trim();
    const ph = phone.trim();

    if (!name) return alert("Full Name required");
    if (!ph) return alert("Phone Number required");
    if (!password) return alert("Password required");
    if (password !== confirm) return alert("Password mismatch");

    try {
      setLoading(true);

      const r = await register({ fullName: name, phone: ph, password, gender });

      if (r?.ok) {
        // ✅ register ok -> profile
        nav("/profile", { replace: true });
      } else {
        alert(r?.message || "Register failed");
      }
    } catch (err) {
      alert(err?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authWrap">
      <div className="authCard">
        <h2 className="authTitle">Create Account</h2>
        <p className="muted center">Join us today! Enter your details below.</p>

        <form onSubmit={submit}>
          <label className="lbl">Full Name</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />

          <label className="lbl">Phone Number</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
          />

          <div className="twoCol">
            <div>
              <label className="lbl">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="lbl">Confirm</label>
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <label className="lbl">Gender</label>
          <div className="rowBetween">
            <label className="radio">
              <input
                type="radio"
                checked={gender === "MALE"}
                onChange={() => setGender("MALE")}
              />
              Male
            </label>

            <label className="radio">
              <input
                type="radio"
                checked={gender === "FEMALE"}
                onChange={() => setGender("FEMALE")}
              />
              Female
            </label>
          </div>

          <button className="btnPinkFull" disabled={loading}>
            {loading ? "Creating..." : "Create Account →"}
          </button>
        </form>

        <div className="muted center" style={{ marginTop: 10 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
