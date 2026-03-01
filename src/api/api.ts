"use client";

const BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

async function request(path: string, options: RequestInit = {}) {
  if (!BASE) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_API_BASE missing. Set it to https://api.thecuriousempire.com",
    };
  }

  const url = `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  // ✅ Content-Type only for JSON (FormData হলে দিবে না)
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as any),
  };

  // যদি caller header দেয় নাই, এবং body FormData না, তখন JSON header বসাবে
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { ok: false, message: text || "Invalid JSON response" };
  }
}

function safeGetLS(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

export const api = {
  BASE,

  // ✅ user token
  token: () => safeGetLS("token"),

  // ✅ admin token
  adminToken: () => safeGetLS("admin_token"),

  // ---------- public ----------
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

  // ---------- USER auth ----------
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

  // ---------- ADMIN auth ----------
  getAdmin: (path: string, adminToken: string) =>
    request(path, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    }),

  postAdmin: (path: string, adminToken: string, body?: any) =>
    request(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: body ? JSON.stringify(body) : undefined,
    }),

  putAdmin: (path: string, adminToken: string, body?: any) =>
    request(path, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: body ? JSON.stringify(body) : undefined,
    }),

  deleteAdmin: (path: string, adminToken: string) =>
    request(path, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    }),

  // ✅ FormData upload (ADMIN)
  postFormAdmin: (path: string, adminToken: string, form: FormData) =>
    request(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form, // ✅ Content-Type auto হবে
    }),

  // ✅ FormData upload (USER) - দরকার হলে
  postFormAuth: (path: string, token: string, form: FormData) =>
    request(path, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }),
};