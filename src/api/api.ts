"use client";

const BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, ""); // শেষের / কেটে দেয়

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { ok: false, message: text || "Invalid JSON response" };
  }
}

function safeToken() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("token") || "";
  } catch {
    return "";
  }
}

export const api = {
  // ✅ expose BASE (Home এর absUrl এ api.BASE দরকার)
  BASE,

  // ✅ token helper (PrivateRoute/ProtectedRoute এর জন্য MUST)
  token: safeToken,

  get: (path: string) => request(path, { method: "GET" }),

  post: (path: string, body?: any) =>
    request(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: (path: string, body?: any) =>
    request(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: (path: string) => request(path, { method: "DELETE" }),

  // 🔐 With token (Authorization header)
  getAuth: (path: string, token: string) =>
    request(path, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }),

  postAuth: (path: string, token: string, body?: any) =>
    request(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    }),

  putAuth: (path: string, token: string, body?: any) =>
    request(path, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    }),

  deleteAuth: (path: string, token: string) =>
    request(path, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
};