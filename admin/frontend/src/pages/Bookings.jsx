// src/pages/Bookings.jsx
import React, { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";

const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const normalizeStatus = (status) =>
  status === "approved" ? "confirmed" : String(status || "").toLowerCase();

const isFinalStatus = (status) =>
  ["cancelled", "confirmed", "completed"].includes(normalizeStatus(status));

export default function Bookings() {
  const { bookings, rooms, approveBooking, rejectBooking } = useAppData();
  const { currentUser } = useAuth();

  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState(null);

  // filter quick based on customer name or room name
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const room = rooms.find((r) => r.id === b.roomId);
      const text = (
        b.customerName +
          " " +
          (b.customerPhone || "") +
        " " +
        (room?.name || "") +
        " " +
        (b.note || "")
      ).toLowerCase();

      const checkIn = String(b.checkIn || "").slice(0, 10);
      const matchedText = !q || text.includes(q.toLowerCase());
      const matchedFrom = !from || (checkIn && checkIn >= from);
      const matchedTo = !to || (checkIn && checkIn <= to);

      return matchedText && matchedFrom && matchedTo;
    });
  }, [bookings, rooms, q, from, to]);

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
    if (detail && isFinalStatus(detail.status)) {
      return;
    }
    if (!currentUser || currentUser.role !== "admin") {
      alert("Chỉ Quản trị viên (admin) mới có quyền duyệt.");
      return;
    }
    approveBooking(id);
    closeDetail();
  }

  // reject
  function handleReject(id) {
    if (detail && isFinalStatus(detail.status)) {
      return;
    }
    rejectBooking(id);
    closeDetail();
  }

  return (
    <div>
      <h1 className="page-title">Quản lý đặt phòng</h1>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            className="input"
            placeholder="Tìm theo tên khách hoặc phòng..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn-outline"
            onClick={() => {
              setQ("");
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div>
            <div className="label">Từ</div>
            <input
              type="date"
              className="input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Đến</div>
            <input
              type="date"
              className="input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <table className="table" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Mã</th><th>Khách hàng</th><th>SĐT</th><th>Phòng</th><th>CheckIn - CheckOut</th><th>Ghi chú</th><th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const room = rooms.find((r) => r.id === b.roomId);
              const displayStatus = b.status === "approved" ? "confirmed" : b.status;
              return (
                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => openDetail(b)}>
                  <td>#{b.id}</td>
                  <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                  <td>{b.customerPhone || "-"}</td>
                  <td>{room?.name}</td>
                  <td>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</td>
                  <td
                    style={{
                      whiteSpace: "normal",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.4,
                      maxHeight: "2.8em",
                    }}
                    title={b.note || "Không có ghi chú"}
                  >
                    {b.note || "-"}
                  </td>
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
            {/** Không cho thao tác khi booking đã ở trạng thái kết thúc */}
            {(() => {
              const actionLocked = isFinalStatus(detail.status);
              return (
                <>
            {/* nội dung chi tiết (dark panel) */}
            <div className="modal-body">
              <h2 style={{ margin: 0 }}>{`Chi tiết đơn #${detail.id}`}</h2>

              <div style={{ marginTop: 12 }}>
                <div className="label">Khách hàng</div>
                <div style={{ fontWeight: 700 }}>{detail.customerName}</div>

                <div className="label" style={{ marginTop: 8 }}>Số điện thoại</div>
                <div style={{ fontWeight: 600 }}>
                  {detail.customerPhone || "Chưa cập nhật"}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Phòng</div>
                <div>{(rooms.find(r => r.id === detail.roomId) || {}).name}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Thời gian</div>
                <div>{fmtDate(detail.checkIn)} → {fmtDate(detail.checkOut)}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Ghi chú</div>
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  {detail.note || "Không có ghi chú"}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="label">Tổng</div>
                <div style={{ fontWeight: 800, color: "var(--accent)" }}>{(detail.total || 0).toLocaleString("vi-VN")}₫</div>
              </div>
            </div>

            {/* action panel: sáng hơn, nổi bật (dùng accent) */}
            <div className="modal-actions">
              <button
                className="btn-outline"
                onClick={() => { handleReject(detail.id); }}
                disabled={actionLocked}
                title={actionLocked ? "Đơn đã chốt trạng thái, không thể từ chối" : "Từ chối đơn"}
              >
                Từ chối
              </button>

              <button
                className="btn-approve"
                onClick={() => { handleApprove(detail.id); }}
                disabled={actionLocked || (currentUser && currentUser.role !== "admin")}
                title={
                  actionLocked
                    ? "Đơn đã chốt trạng thái, không thể duyệt"
                    : currentUser && currentUser.role !== "admin"
                    ? "Bạn không có quyền duyệt"
                    : "Duyệt đơn"
                }
              >
                Duyệt & Chốt phòng
              </button>

              <button className="btn-outline" onClick={closeDetail}>Đóng</button>
            </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* ================= END MODAL ================= */}
    </div>
  );
}
