"use client";

const BASE = process.env.NEXT_PUBLIC_API_BASE || "";

async function request(path: string, options: RequestInit = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      // ✅ CORS সহজ করার জন্য default omit
      credentials: options.credentials ?? "omit",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const text = await res.text();
    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { ok: false, message: text };
    }

    // ✅ non-2xx হলেও crash না করে ok:false দিয়ে দেবে
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: data?.message || res.statusText || "Request failed",
        data,
      };
    }

    return data;
  } catch (err: any) {
    // ✅ fetch/CORS/network error হলে crash না করে fallback
    return {
      ok: false,
      message: err?.message || "Network/CORS error",
    };
  }
}

export const api = {
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