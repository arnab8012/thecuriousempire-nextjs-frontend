"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/api";
import AdminRoute from "../../components/AdminRoute";
import Link from "@/components/Link";

function Inner() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [banners, setBanners] = useState<any[]>([]); // DB
  const [pending, setPending] = useState<any[]>([]); // uploaded not saved [{url, public_id}]

  // ✅ link input
  const [linkUrl, setLinkUrl] = useState("");

  // ✅ helper: relative url হলে BASE যোগ করবে (যাতে admin panel এও ছবি ঠিক আসে)
  const absUrl = useMemo(() => {
    return (u: any) => {
      if (!u) return "";
      const s = String(u);
      if (s.startsWith("http://") || s.startsWith("https://")) return s;
      return `${api.BASE}${s.startsWith("/") ? "" : "/"}${s}`;
    };
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/banners");
      setBanners(r?.ok ? r.banners || [] : []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ✅ upload images to cloudinary
  const uploadBannerImages = async (files: FileList | null) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    const t = api.adminToken();
    if (!t) {
      alert("No token");
      return;
    }

    const sliced = arr.slice(0, 10);
    setUploading(true);

    const fd = new FormData();
    for (const f of sliced) fd.append("images", f);

    try {
      const res = await fetch(`${api.BASE}/api/admin/upload/banner-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
        body: fd,
      });

      const data = await res.json();

      if (!data?.ok) {
        alert(data?.message || "Upload failed");
        return;
      }

      const uploaded = Array.isArray(data.banners) ? data.banners : [];
      // ✅ ensure url absolute
      const fixed = uploaded.map((x: any) => ({ ...x, url: absUrl(x?.url) }));

      setPending((p) => [...p, ...fixed].slice(0, 10));
    } catch {
      alert("Upload error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ✅ add banner by URL (link system)
  const addByLink = () => {
    const url = String(linkUrl || "").trim();
    if (!url) return alert("Image link required");
    if (!url.startsWith("http")) return alert("Valid http/https link দিন");

    setPending((p) => [...p, { url, public_id: "link_only" }].slice(0, 10));
    setLinkUrl("");
  };

  const removePending = (idx: number) => {
    setPending((p) => p.filter((_, i) => i !== idx));
  };

  // ✅ save pending banners into DB
  const savePendingToDB = async () => {
    if (!pending.length) return alert("No banners to save");

    const t = api.adminToken();
    if (!t) return alert("No token");

    setSaving(true);
    try {
      // ✅ FIX: admin token সহ call দিতে হবে (api.post() টোকেন নেয় না)
      const r = await api.postAuth("/api/admin/banners", t, { banners: pending });

      if (!r?.ok) {
        alert(r?.message || "Save failed");
        return;
      }

      setPending([]);
      await load();
      alert("✅ Banners saved");
    } catch {
      alert("Save error");
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;

    const t = api.adminToken();
    if (!t) return alert("No token");

    try {
      const res = await fetch(`${api.BASE}/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });

      const data = await res.json();
      if (!data?.ok) return alert(data?.message || "Delete failed");

      load();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="container">
      <div className="rowBetween">
        <h2 style={{ margin: 0 }}>Admin Banners</h2>
        <Link className="btnGhost" to="/admin">
          ← Back
        </Link>
      </div>

      {/* ✅ Upload + link card */}
      <div className="box adminCard">
        <label className="lbl">Upload Banner Images (Max 10)</label>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          disabled={uploading}
          onChange={(e) => uploadBannerImages(e.target.files)}
        />

        {uploading && (
          <div className="muted" style={{ marginTop: 8 }}>
            Uploading...
          </div>
        )}

        <hr style={{ margin: "12px 0" }} />

        <label className="lbl">Add Banner by Image Link (URL)</label>
        <div className="rowBetween" style={{ gap: 10 }}>
          <input
            className="input"
            value={linkUrl}
            placeholder="https://example.com/banner.jpg"
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <button className="btnGhost" type="button" onClick={addByLink}>
            Add Link
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <b>Pending (not saved): {pending.length}</b>
        </div>

        {pending.length > 0 ? (
          <>
            <div className="bannerThumbGrid">
              {pending.map((b, i) => (
                <div key={(b.public_id || "x") + i} className="bannerThumb">
                  <img src={absUrl(b.url)} alt="" />
                  <button
                    type="button"
                    className="thumbX"
                    onClick={() => removePending(i)}
                    aria-label="remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btnPinkFull"
              onClick={savePendingToDB}
              disabled={saving || uploading}
              style={{ marginTop: 12 }}
            >
              {saving ? "Saving..." : "Save banners to website"}
            </button>
          </>
        ) : (
          <div className="muted" style={{ marginTop: 8 }}>
            No pending banners
          </div>
        )}
      </div>

      {/* ✅ Live banners card */}
      <div className="box adminCard">
        <b>Live banners on website</b>

        {loading ? (
          <div className="muted" style={{ marginTop: 8 }}>
            Loading...
          </div>
        ) : banners.length === 0 ? (
          <div className="muted" style={{ marginTop: 8 }}>
            No banners yet
          </div>
        ) : (
          <div className="bannerThumbGrid" style={{ marginTop: 10 }}>
            {banners.map((b) => (
              <div key={b._id} className="bannerThumb">
                <img src={absUrl(b.url)} alt="" />
                <button
                  type="button"
                  className="thumbBin"
                  onClick={() => deleteBanner(b._id)}
                  aria-label="delete"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBanners() {
  return (
    <AdminRoute>
      <Inner />
    </AdminRoute>
  );
}