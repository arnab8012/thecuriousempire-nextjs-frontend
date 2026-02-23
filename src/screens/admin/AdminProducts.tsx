"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../api/api";
import AdminRoute from "../../components/AdminRoute";
import Link from "@/components/Link";

function Inner() {
  const fileRef = useRef(null);

  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ id থাকলে edit mode
  const [form, setForm] = useState({
    id: "",
    title: "",
    category: "",
    price: 0,
    compareAtPrice: 0,
    images: [], // urls array
    description: "",
    variants: "Pink & Blue:4",
  });

  const load = async () => {
    const c = await api.get("/api/categories");
    if (c?.ok) {
      setCats(c.categories || []);
      setForm((f) => ({
        ...f,
        category: f.category || (c.categories?.[0]?._id || ""),
      }));
    }

    const p = await api.get("/api/products");
    if (p?.ok) setProducts(p.products || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const parseVariants = () => {
    // "Pink & Blue:4,Red:2"
    const parts = String(form.variants || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    return parts
      .map((x) => {
        const [name, stock] = x.split(":");
        return { name: (name || "").trim(), stock: Number(stock || 0) };
      })
      .filter((v) => v.name);
  };

  // ✅ Upload images to backend -> cloudinary -> returns { ok, images:[url...] }
  const uploadImages = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const remain = 5 - (form.images?.length || 0);
    if (remain <= 0) {
      alert("Max 5 images already added");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const sliced = files.slice(0, remain);

    setUploading(true);
    const fd = new FormData();
    for (const f of sliced) fd.append("images", f);

    try {
      const t = api.adminToken();
      const res = await fetch(`${api.BASE}/api/admin/upload/product-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
        body: fd,
      });

      // ✅ Render/Server কখনও non-json দিতে পারে, তাই safe parse
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { ok: false, message: text || "Non-JSON response" };
      }

      if (!data?.ok) {
        alert(data?.message || "Upload failed");
        return;
      }

      const newUrls = Array.isArray(data.images) ? data.images : [];

      setForm((f) => ({
        ...f,
        images: [...(f.images || []), ...newUrls].slice(0, 5),
      }));
    } catch (e) {
      alert(e?.message ? `Upload error: ${e.message}` : "Upload error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx) => {
    setForm((f) => ({
      ...f,
      images: (f.images || []).filter((_, i) => i !== idx),
    }));
  };

  const clearAllImages = () => {
    setForm((f) => ({ ...f, images: [] }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const resetForm = () => {
    setForm((f) => ({
      ...f,
      id: "",
      title: "",
      price: 0,
      compareAtPrice: 0,
      images: [],
      description: "",
      variants: "Pink & Blue:4",
    }));
    if (fileRef.current) fileRef.current.value = "";
  };

  // ✅ Add + Update (same button)
  const saveProduct = async () => {
    if (uploading) return alert("Please wait for upload to finish");
    if (!String(form.title || "").trim()) return alert("Title required");
    if (!form.category) return alert("Category required");

    // ✅ Price allow 0? তুমি চাইলে 0 allow করা যায়
    if (Number(form.price) <= 0) return alert("Price required");
    if (!form.images?.length) return alert("Please upload at least 1 image");

    setSaving(true);
    try {
      const payload = {
        title: String(form.title || "").trim(),
        category: form.category,
        price: Number(form.price || 0),
        compareAtPrice: Number(form.compareAtPrice || 0),
        images: form.images || [],
        description: form.description || "",
        variants: parseVariants(),
      };

      const t = api.adminToken();

      // ✅ Edit mode
      if (form.id) {
        // ⚠️ তোমার api.js এ putAuth নেই, তাই api.put ব্যবহার
        const r = await api.put(`/api/admin/products/${form.id}`, payload, t);
        if (!r?.ok) return alert(r?.message || "Update failed");
        alert("✅ Product updated");
      } else {
        // ✅ Add mode
        const r = await api.post("/api/admin/products", payload, t);
        if (!r?.ok) return alert(r?.message || "Add failed");
        alert("✅ Product added");
      }

      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (p) => {
    setForm({
      id: p._id,
      title: p.title || "",
      category: p.category?._id || p.category || "",
      price: p.price || 0,
      compareAtPrice: p.compareAtPrice || 0,
      images: Array.isArray(p.images) ? p.images : [],
      description: p.description || "",
      variants:
        Array.isArray(p.variants) && p.variants.length
          ? p.variants.map((v) => `${v.name}:${v.stock}`).join(",")
          : "Pink & Blue:4",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDelete = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    const t = api.adminToken();
    const r = await api.delete(`/api/admin/products/${id}`, t);
    if (!r?.ok) return alert(r?.message || "Delete failed");

    alert("✅ Deleted");
    load();

    // যদি delete করা product এখন edit mode এ থাকে, form reset
    if (form.id === id) resetForm();
  };

  return (
    <div className="container">
      <div className="rowBetween">
        <h2>Admin Products</h2>
        <Link className="btnGhost" to="/admin">
          ← Back
        </Link>
      </div>

      <div className="box">
        <div className="rowBetween" style={{ gap: 12 }}>
          <b>{form.id ? "Edit Product" : "Add Product"}</b>
          {form.id ? (
            <button
              className="btnGhost"
              type="button"
              onClick={resetForm}
              disabled={uploading || saving}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <label className="lbl">Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <label className="lbl">Category</label>
        <select
          className="input"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {cats.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="twoCol">
          <div>
            <label className="lbl">Price</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div>
            <label className="lbl">Compare At</label>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              value={form.compareAtPrice}
              onChange={(e) =>
                setForm({ ...form, compareAtPrice: e.target.value })
              }
            />
          </div>
        </div>

        <label className="lbl">
          Product Images (Max 5) — এখন আছে: {form.images?.length || 0}/5
        </label>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          disabled={uploading}
          onChange={(e) => uploadImages(e.target.files)}
        />

        {uploading ? <div className="muted">Uploading images...</div> : null}

        {form.images?.length ? (
          <>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
              {form.images.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: 110,
                      height: 110,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #eee",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      borderRadius: 999,
                      border: "none",
                      padding: "4px 8px",
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btnGhost"
              onClick={clearAllImages}
              style={{ marginTop: 10 }}
              disabled={uploading}
            >
              Clear all images
            </button>
          </>
        ) : (
          <div className="muted" style={{ marginTop: 6 }}>
            No images uploaded yet
          </div>
        )}

        <label className="lbl">
          Variants (format: Name:Stock,Name2:Stock2)
        </label>
        <input
          className="input"
          value={form.variants}
          onChange={(e) => setForm({ ...form, variants: e.target.value })}
        />

        <label className="lbl">Description</label>
        <textarea
          className="input"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <button
          className="btnPinkFull"
          onClick={saveProduct}
          disabled={uploading || saving}
        >
          {uploading
            ? "Uploading..."
            : saving
            ? "Saving..."
            : form.id
            ? "Update Product"
            : "Add Product"}
        </button>
      </div>

      <div className="grid">
        {products.map((p) => (
          <div className="card" key={p._id}>
            <img
              className="cardImg"
              src={
                p.images?.[0] ||
                "https://via.placeholder.com/400x300?text=Product"
              }
              alt=""
            />
            <div className="cardBody">
              <div className="cardTitle">{p.title}</div>
              <div className="muted">{p.category?.name || ""}</div>
              <div className="priceRow">
                <span className="price">৳ {p.price}</span>
              </div>

              {/* ✅ Edit/Delete actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button
                  className="btnGhost"
                  type="button"
                  onClick={() => onEdit(p)}
                >
                  Edit
                </button>
                <button
                  className="btnDark"
                  type="button"
                  onClick={() => onDelete(p._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  return (
    <AdminRoute>
      <Inner />
    </AdminRoute>
  );
}
