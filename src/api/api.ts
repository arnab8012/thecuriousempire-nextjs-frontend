"use client";

const PROD_FALLBACK = "https://api.thecuriousempire.com";

const BASE_RAW =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NODE_ENV === "production" ? PROD_FALLBACK : "http://localhost:5000");

export const API_BASE = String(BASE_RAW).replace(/\/$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { auth?: boolean }
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(options?.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (options?.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers, cache: "no-store" });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || "Invalid response" };
  }

  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data as T;
}