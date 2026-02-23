"use client";

// src/api/api.js (Next.js compatible)

// ✅ PROD fallback (Render backend)
const PROD_FALLBACK = "https://api.thecuriousempire.com";

// ✅ Next.js env: NEXT_PUBLIC_API_BASE
// ✅ If env missing: PROD -> fallback, DEV -> localhost
const BASE_RAW =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:5000");

const BASE = String(BASE_RAW).replace(/\/$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}
function getAdminToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("admin_token") || "";
}

async function jsonFetch(url, opts = {}) {
  try {
    const r = await fetch(url, {
      ...opts,
      credentials: "include",
    });

    const text = await r.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { ok: false, message: text || "Non-JSON response" };
    }

    if (!r.ok && data && typeof data === "object" && !("status" in data)) {
      data.status = r.status;
    }

    return data;
  } catch (e) {
    return { ok: false, message: e?.message || "Network error" };
  }
}

export const api = {
  BASE,

  get(path) {
    return jsonFetch(`${BASE}${path}`, { method: "GET" });
  },

  getAuth(path, token) {
    return jsonFetch(`${BASE}${path}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  post(path, body, token) {
    return jsonFetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body || {}),
    });
  },

  postForm(path, formData, token) {
    return jsonFetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  },

  postAuth(path, token, body) {
    return jsonFetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body || {}),
    });
  },

  put(path, body, token) {
    return jsonFetch(`${BASE}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body || {}),
    });
  },

  putAuth(path, token, body) {
    return jsonFetch(`${BASE}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body || {}),
    });
  },

  delete(path, token) {
    return jsonFetch(`${BASE}${path}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  token: getToken,
  adminToken: getAdminToken,
};
