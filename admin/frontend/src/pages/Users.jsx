// src/pages/Users.jsx
import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";

export default function Users() {
  const { users, changeUserRole, toggleUserActive } = useAppData();
  const [search, setSearch] = useState("");

  const handleRoleChange = async (userId, role) => {
    const res = await changeUserRole(userId, role);
    if (!res?.ok) {
      alert(res?.message || "Cập nhật role thất bại");
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const lowered = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(lowered) ||
      (u.email && u.email.toLowerCase().includes(lowered)) ||
      (u.phone && u.phone.toLowerCase().includes(lowered))
    );
  });

  return (
    <div>
      <h1 className="page-title">Người dùng & phân quyền</h1>
      <div style={{ marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Tìm theo email hoặc username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Username</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Display</th>
              <th>Role</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.phone || "-"}</td>
                <td>{u.displayName}</td>
                <td>
                  <select
                    className="input"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="admin">admin</option>
                    <option value="customer">customer</option>
                  </select>
                </td>
                <td style={{ color: u.active ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                  {u.active ? "Active" : "Locked"}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn-outline" onClick={() => toggleUserActive(u.id)}>
                    {u.active ? "Khoá" : "Mở"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
