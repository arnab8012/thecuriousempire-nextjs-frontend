"use client";

import { useEffect, useState } from "react";
import { api } from "../../api/api";
import AdminRoute from "../../components/AdminRoute";
import Link from "@/components/Link";

function Inner() {
  const [cats, setCats] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const [icon, setIcon] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/api/categories");
      if (r?.ok) setCats(Array.isArray(r.categories) ? r.categories : []);
      else setCats([]);
    } catch {
      setCats([]);
    }
  };

  // ✅ Upload icon (FormData + Admin token)
  async function uploadCategoryIcon(file: File) {
    const token = api.adminToken?.() || ""; // admin_token
    if (!token) {
      alert("Admin token missing. Please login again.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();

      // ⚠️ backend যেই field name expect করে সেটাই দিতে হবে
      // তুমি দিয়েছো "image" — ঠিক থাকলে রেখে দাও
      fd.append("image", file);

      const url = `${api.BASE}/api/admin/upload/category-icon`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ✅ এখানে Content-Type সেট করবে না (FormData হলে ব্রাউজার নিজে সেট করে)
        },
        body: fd,
      });

      const text = await res.text();
      let r: any = null;
      try {
        r = text ? JSON.parse(text) : null;
      } catch {
        r = { ok: false, message: text || "Invalid JSON response" };
      }

      if (!r?.ok) {
        alert(r?.message || "Icon upload failed");
        return;
      }

      // backend: { ok:true, icon:{ url, public_id } }
      setIcon(r?.icon?.url || "");
    } catch (e) {
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ✅ Add category (admin token সহ postAuth)
  const add = async () => {
    const n = name.trim();
    if (!n) return alert("Category name required");
    if (!icon) return alert("Category icon required");

    const t = api.adminToken?.() || "";
    if (!t) return alert("Admin token missing. Please login again.");

    setLoading(true);
    try {
      // ✅ এখানে api.post() নয়, postAuth() লাগবে
      const r = await api.postAuth("/api/admin/categories", t, { name: n, icon });

      if (!r?.ok) return alert(r?.message || "Failed");

      setName("");
      setIcon("");
      await load();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete category (admin token সহ deleteAuth)
  const remove = async (id: string, catName: string) => {
    if (!window.confirm(`Delete category "${catName}" ?`)) return;

    const t = api.adminToken?.() || "";
    if (!t) return alert("Admin token missing. Please login again.");

    // ✅ এখানে api.delete() নয়, deleteAuth() লাগবে
    const r = await api.deleteAuth(`/api/admin/categories/${id}`, t);
    if (!r?.ok) return alert(r?.message || "Delete failed");

    load();
  };

  return (
    <div className="container">
      <div className="rowBetween">
        <h2 style={{ margin: 0 }}>Admin Categories</h2>
        <Link className="btnGhost" to="/admin">
          ← Back
        </Link>
      </div>

      {/* Add */}
      <div className="box adminCard" style={{ marginTop: 12 }}>
        <label className="lbl">Category name</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electronics"
        />

        {/* ✅ Category icon upload */}
        <label className="lbl">Category icon</label>

        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) uploadCategoryIcon(file);
          }}
        />

        {uploading && (
          <div className="muted" style={{ marginTop: 6 }}>
            Uploading icon...
          </div>
        )}

        {icon && (
          <img
            src={icon}
            alt="Category Icon"
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              marginTop: 8,
              objectFit: "cover",
              border: "1px solid #ddd",
            }}
          />
        )}

        <button className="btnPinkFull" type="button" onClick={add} disabled={loading}>
          {loading ? "Saving..." : "Add Category"}
        </button>
      </div>

      {/* List */}
      <div className="box adminCard" style={{ marginTop: 12 }}>
        {cats.length === 0 ? (
          <div className="muted">No categories</div>
        ) : (
          cats.map((c: any) => (
            <div key={c._id} className="adminListRow">
              <div>
                <b>{c.name}</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  {c.createdAt ? new Date(c.createdAt).toDateString() : ""}
                </div>
              </div>

              <button
                className="btnGhost"
                type="button"
                style={{ color: "#ff2d55", borderColor: "rgba(255,45,85,0.25)" }}
                onClick={() => remove(c._id, c.name)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminCategories() {
  return (
    <AdminRoute>
      <Inner />
    </AdminRoute>
  );
}