"use client";

const KEY = "shipping_book_v1";

export function loadBook() {
  try {
    const b = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      selectedId: b.selectedId || "",
      items: Array.isArray(b.items) ? b.items : []
    };
  } catch {
    return { selectedId: "", items: [] };
  }
}

export function saveBook(book) {
  localStorage.setItem(KEY, JSON.stringify(book));
}

export function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
