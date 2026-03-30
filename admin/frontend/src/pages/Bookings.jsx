// src/pages/Bookings.jsx
import React, { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

/*
  Bookings.jsx
  - list booking
  - filter/search (simple)
  - modal detail: overlay blur, highlight action area
  - chỉ admin được approve (kiểm tra currentUser.role)
*/

export default function Bookings() {
  const { bookings, rooms, approveBooking, rejectBooking } = useAppData();
  const { currentUser } = useAuth();

  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);

  // filter quick based on customer name or room name
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const room = rooms.find((r) => r.id === b.roomId);
      const text = (b.customerName + " " + (room?.name || "")).toLowerCase();
      if (!q) return true;
      return text.includes(q.toLowerCase());
    });
  }, [bookings, rooms, q]);

  // open detail modal
  function openDetail(b) {
    setDetail(b);
    // add class to body to disable scroll if needed
    document.body.style.overflow = "hidden";
  }

  // close modal
  function closeDetail() {
    setDetail(null);
    document.body.style.overflow = "";
  }

  // approve with role check
  function handleApprove(id) {
    if (!currentUser || currentUser.role !== "admin") {
      alert("Chỉ Quản trị viên (admin) mới có quyền duyệt.");
      return;
    }
    approveBooking(id);
    closeDetail();
  }

  // reject
  function handleReject(id) {
    rejectBooking(id);
    closeDetail();
  }

  return (
    <div>
      <h1 className="page-title">Quản lý đặt phòng</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <input
          className="input"
          placeholder="Tìm theo tên khách hoặc phòng..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={{ marginLeft: "auto" }}>
          <button className="btn-outline" onClick={() => setQ("")}>Clear</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Mã</th><th>Khách</th><th>Phòng</th><th>Ngày</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const room = rooms.find((r) => r.id === b.roomId);
              const displayStatus = b.status === "approved" ? "confirmed" : b.status;
              return (
                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => openDetail(b)}>
                  <td>#{b.id}</td>
                  <td>{b.customerName}</td>
                  <td>{room?.name}</td>
                  <td>{b.checkIn} → {b.checkOut}</td>
                  <td
                    style={{
                      fontWeight: 700,
                      color:
                        displayStatus === "confirmed"
                          ? "#10b981"
                          : displayStatus === "pending"
                          ? "#ffffff"
                          : displayStatus === "rejected"
                          ? "#ef4444"
                          : displayStatus === "cancelled" || displayStatus === "occupied"
                          ? "#facc15"
                          : "#06b6d4",
                    }}
                  >
                    {String(
                      displayStatus === "occupied" ? "booked" : displayStatus || ""
                    ).toUpperCase()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL DETAIL ================= */}
      {detail && (
        <div className="modal-overlay"> {/* overlay: dim + blur toàn bộ background */}
          <div className="modal-window" role="dialog" aria-modal="true">
            {/* nội dung chi tiết (dark panel) */}
            <div className="modal-body">
              <h2 style={{ margin: 0 }}>{`Chi tiết đơn #${detail.id}`}</h2>

              <div style={{ marginTop: 12 }}>
                <div className="label">Khách hàng</div>
                <div style={{ fontWeight: 700 }}>{detail.customerName}</div>
                <div className="small">{detail.customerPhone || ""}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Phòng</div>
                <div>{(rooms.find(r => r.id === detail.roomId) || {}).name}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Thời gian</div>
                <div>{detail.checkIn} → {detail.checkOut}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Tổng</div>
                <div style={{ fontWeight: 800, color: "var(--accent)" }}>{(detail.total || 0).toLocaleString("vi-VN")}₫</div>
              </div>
            </div>

            {/* action panel: sáng hơn, nổi bật (dùng accent) */}
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => { handleReject(detail.id); }}>
                Từ chối
              </button>

              <button
                className="btn-approve"
                onClick={() => { handleApprove(detail.id); }}
                title={currentUser && currentUser.role !== "admin" ? "Bạn không có quyền duyệt" : "Duyệt đơn"}
              >
                Duyệt & Chốt phòng
              </button>

              <button className="btn-outline" onClick={closeDetail}>Đóng</button>
            </div>
          </div>
        </div>
      )}
      {/* ================= END MODAL ================= */}
    </div>
  );
}
