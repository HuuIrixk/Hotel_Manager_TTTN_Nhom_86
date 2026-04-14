// src/pages/Reports.jsx
import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";

/*
  Reports:
  - filter by date range (checkIn)
  - show summary total revenue & table of bookings filtered
  - export CSV (demo: create csv string + open in new tab)
*/

const fmtDate = (d) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export default function Reports() {
  const { getRevenue, rooms } = useAppData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { total, filtered } = getRevenue(from, to);

  return (
    <div>
      <h1 className="page-title">Báo cáo doanh thu</h1>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <div>
          <div className="label">Từ</div>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <div className="label">Đến</div>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="small">Tổng doanh thu</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>{total.toLocaleString("vi-VN")}₫</div>
          </div>
        </div>

        <table className="table" style={{ marginTop: 12 }}>
          <thead><tr><th>Mã</th><th>Khách hàng</th><th>Phòng</th><th>CheckIn - CheckOut</th><th>Giá</th></tr></thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>#{b.id}</td>
                <td>{b.customerName}</td>
                <td>{rooms.find((r) => r.id === b.roomId)?.name ?? b.roomId}</td>
                <td>{fmtDate(b.checkIn)} - {fmtDate(b.checkOut)}</td>
                <td>{b.total.toLocaleString("vi-VN")}₫</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
