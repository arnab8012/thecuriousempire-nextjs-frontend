"use client";

// src/pages/Settings.jsx

import Link from "@/components/Link";
import { useNavigate } from "@/utils/useNavigate";
import { useAuth } from "../context/AuthContext";
import useNoIndex from "../utils/useNoIndex";

export default function Settings() {
  useNoIndex("noindex, nofollow");
  const nav = useNavigate();
  const { user, logout } = useAuth();

  // ✅ login না থাকলে login এ যাবে
  if (!user) {
    nav("/login");
    return null;
  }

  const doLogout = () => {
    const ok = window.confirm("Logout করবেন?");
    if (!ok) return;

    logout();
    nav("/login");
  };

  return (
    <div className="container settingsPage">
      {/* ✅ Header */}
      <div className="settingsHead">
        <h2 className="settingsTitle">Settings</h2>

        <button className="settingsBackBtn" type="button" onClick={() => nav(-1)}>
          ← Back
        </button>
      </div>

      {/* ✅ Card */}
      <div className="settingsCard premiumCard">
        <div className="settingsRow">
          <div className="settingsLabel">Name</div>
          <div className="settingsValue">{user?.fullName || "—"}</div>
        </div>

        <div className="settingsRow">
          <div className="settingsLabel">Phone</div>
          <div className="settingsValue">{user?.phone || "—"}</div>
        </div>

        <div className="settingsBtns">
          {/* ✅ SettingsEdit.jsx এ যাবে */}
          <Link to="/settings/edit" className="settingsBtn editBtn">
            Edit Profile
          </Link>

          <button type="button" className="settingsBtn logoutBtn" onClick={doLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
