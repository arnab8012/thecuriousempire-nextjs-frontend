"use client";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

async function jsonFetch(url, opts = {}) {
  try {
    const r = await fetch(url, {
      ...opts,
      credentials: "include",
      cache: "no-store",
    });

    const text = await r.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { ok: false, message: text || "Non-JSON response" };
    }

    if (!("ok" in data)) data.ok = r.ok;
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

  post(path, body) {
    return jsonFetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
  },
};