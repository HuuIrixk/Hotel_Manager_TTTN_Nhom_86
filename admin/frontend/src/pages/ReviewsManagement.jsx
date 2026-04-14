import React, { useState, useEffect } from "react";
import { get, del } from "../api/api";

const STARS = (n) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < n ? "#f59e0b" : "#334155" }}>★</span>
  ));

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    const data = await get("/reviews/admin");
    setReviews(data || []);
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Xóa đánh giá này?")) return;
    try {
      await del(`/reviews/admin/${id}`);
      setReviews((prev) => prev.filter((r) => r.review_id !== id));
    } catch {
      alert("Xóa thất bại.");
    }
  }

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.user && r.user.username && r.user.username.toLowerCase().includes(q)) ||
      String(r.user_id).includes(q)
    );
  });

  return (
    <div>
      <h1 className="page-title">Quản lý đánh giá</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <input
          className="input"
          style={{ flex: 1 }}
          placeholder="Tìm theo nội dung, tên khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="btn-outline" onClick={() => setSearch("")}>
            Xóa
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: 20, color: "#94a3b8" }}>Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 20, color: "#94a3b8" }}>Không có đánh giá nào.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách hàng</th>
                <th>Sao</th>
                <th>Nội dung</th>
                <th>Ngày</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.review_id}>
                  <td>#{r.review_id}</td>
                  <td>{r.user ? r.user.username : r.user_id}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{STARS(r.rating)}</td>
                  <td
                    style={{
                      maxWidth: 320,
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      color: "#cbd5e1",
                    }}
                    title={r.comment}
                  >
                    {r.comment}
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: 13 }}>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-outline"
                      style={{ borderColor: "#ef4444", color: "#ef4444" }}
                      onClick={() => handleDelete(r.review_id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

