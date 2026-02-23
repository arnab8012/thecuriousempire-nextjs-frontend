"use client";

// src/pages/SettingsEdit.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "@/utils/useNavigate";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import useNoIndex from "../utils/useNoIndex";

export default function SettingsEdit() {
  useNoIndex("noindex, nofollow");
  const nav = useNavigate();
  const { user } = useAuth(); // (optional) refreshMe থাকলে destructure করতে পারবে

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState(""); // backend style: MALE/FEMALE/OTHER
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName || "");

    // ✅ normalize gender to MALE/FEMALE/OTHER
    const g = String(user?.gender || "").toUpperCase();
    if (g === "MALE" || g === "FEMALE" || g === "OTHER") setGender(g);
    else setGender("");
  }, [user]);

  const onSave = async (e) => {
    e.preventDefault();

    const name = fullName.trim();
    if (!name) {
      alert("Full Name required");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      if (!token) {
        nav("/login");
        return;
      }

      // ✅ Backend route matches: PUT /api/auth/me
      const r = await api.put(
        "/api/auth/me",
        {
          fullName: name,
          gender: gender || undefined
        },
        token
      );

      if (!r?.ok) {
        alert(r?.message || "Save failed");
        return;
      }

      // ✅ optional: যদি AuthContext এ refreshMe/addUserUpdate থাকে তাহলে এখান থেকে call করবে
      // await refreshMe?.();

      alert("Saved ✅");
      nav("/settings");
    } catch (err) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container editProfilePage">
      {/* Header */}
      <div className="editHead">
        <h2 className="editTitle">Edit Profile</h2>

        <button className="editBackBtn" type="button" onClick={() => nav(-1)} disabled={saving}>
          ← Back
        </button>
      </div>

      {/* Card */}
      <form className="editCard" onSubmit={onSave}>
        <div className="editGrid">
          {/* Full Name */}
          <div className="field">
            <label className="lbl">Full Name</label>
            <input
              className="inp"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>

          {/* Gender */}
          <div className="field">
            <label className="lbl">Gender</label>
            <select className="inp" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="editBtns">
          <button className="btnCancel" type="button" onClick={() => nav(-1)} disabled={saving}>
            Cancel
          </button>

          <button className="btnSave" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* bottom spacing so footer/nav never sticks */}
      <div className="editBottomSpace" />
    </div>
  );
}
