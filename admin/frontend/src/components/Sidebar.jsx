import React from "react";

export default function Sidebar({ page, setPage }) {
  const menu = [
    { label: "Dashboard", page: "dashboard" },
    { label: "Quản lý phòng", page: "rooms" },
    { label: "Quản lý đặt phòng", page: "bookings" },
    { label: "Người dùng", page: "users" },
    { label: "Báo cáo", page: "reports" },
    { label: "Liên hệ", page: "contact" },
    { label: "Đánh giá", page: "reviews" },
    { label: "Cơ sở tri thức AI", page: "knowledge" },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">HOTEL ADMIN</div>

      {menu.map((m) => (
        <button
          key={m.page}
          className={"menu-btn " + (page === m.page ? "active" : "")}
          onClick={() => setPage(m.page)}
        >
          {m.label}
        </button>
      ))}
    </aside>
  );
}
