import React, { useState, useEffect } from "react";
import { get, put, del } from "../api/api";

export default function Contact() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all"); // all | unread | read

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const data = await get("/contact");
    setMessages(data || []);
    setLoading(false);
  }

  async function handleMarkRead(id) {
    await put(`/contact/${id}/read`);
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );
    if (selected?.id === id) setSelected((s) => ({ ...s, is_read: true }));
  }

  async function handleDelete(id) {
    if (!window.confirm("Xóa tin nhắn này?")) return;
    await del(`/contact/${id}`);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function openDetail(msg) {
    setSelected(msg);
    if (!msg.is_read) handleMarkRead(msg.id);
  }

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read") return m.is_read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <h1 className="page-title">
        Tin nhắn liên hệ
        {unreadCount > 0 && (
          <span
            style={{
              marginLeft: 10,
              background: "#ef4444",
              color: "#fff",
              borderRadius: 12,
              padding: "2px 10px",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {unreadCount} mới
          </span>
        )}
      </h1>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all", label: "Tất cả" },
          { key: "unread", label: "Chưa đọc" },
          { key: "read", label: "Đã đọc" },
        ].map((t) => (
          <button
            key={t.key}
            className={"btn-outline" + (filter === t.key ? " active" : "")}
            onClick={() => setFilter(t.key)}
            style={
              filter === t.key
                ? { borderColor: "#22d3ee", color: "#22d3ee" }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* Message list */}
        <div className="card" style={{ flex: "0 0 420px", padding: 0, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: 20, color: "#94a3b8" }}>Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 20, color: "#94a3b8" }}>Không có tin nhắn nào.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {filtered.map((msg) => (
                <li
                  key={msg.id}
                  onClick={() => openDetail(msg)}
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                    background:
                      selected?.id === msg.id
                        ? "rgba(34,211,238,0.08)"
                        : !msg.is_read
                        ? "rgba(34,211,238,0.04)"
                        : "transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontWeight: !msg.is_read ? 700 : 400,
                        color: !msg.is_read ? "#e2e8f0" : "#94a3b8",
                        fontSize: 14,
                      }}
                    >
                      {!msg.is_read && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#22d3ee",
                            marginRight: 6,
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      {msg.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date(msg.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{msg.email}</div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      marginTop: 4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 360,
                    }}
                  >
                    {msg.message}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                  {selected.name}
                </h2>
                <div style={{ color: "#22d3ee", fontSize: 13, marginTop: 4 }}>{selected.email}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
                  {new Date(selected.created_at).toLocaleString("vi-VN")}
                </div>
              </div>
              <button
                className="btn-outline"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
                onClick={() => handleDelete(selected.id)}
              >
                Xóa
              </button>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                padding: "16px 18px",
                color: "#cbd5e1",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                minHeight: 120,
              }}
            >
              {selected.message}
            </div>
            {!selected.is_read && (
              <button
                className="btn-outline"
                style={{ marginTop: 12, borderColor: "#22d3ee", color: "#22d3ee" }}
                onClick={() => handleMarkRead(selected.id)}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
        ) : (
          <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
            <p style={{ color: "#64748b" }}>Chọn một tin nhắn để xem chi tiết.</p>
          </div>
        )}
      </div>
    </div>
  );
}
